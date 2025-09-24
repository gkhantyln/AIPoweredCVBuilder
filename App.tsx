
import React, { useState, useRef, useEffect } from 'react';
import CVForm from './components/CVForm';
import CVPreview from './components/CVPreview';
import { CVData } from './types';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { DownloadIcon } from './components/icons/DownloadIcon';
import { UploadIcon } from './components/icons/UploadIcon';
import { TrashIcon } from './components/icons/TrashIcon';
import { SaveIcon } from './components/icons/SaveIcon';
import { WrenchIcon } from './components/icons/WrenchIcon';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { parseCVWithAI, initializeAi } from './services/geminiService';

const initialData: CVData = {
  personalInfo: { name: '', title: '', email: '', phone: '', website: '', location: '', photo: null },
  summary: '',
  experience: [],
  projects: [],
  education: [],
  certifications: [],
  skills: '',
};

const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
);

const AppContent: React.FC = () => {
  const [cvData, setCvData] = useState<CVData>(initialData);
  const [apiKey, setApiKey] = useState('');
  const [tempApiKey, setTempApiKey] = useState('');
  const [showApiKeySaved, setShowApiKeySaved] = useState(false);
  const { t, setLanguage, language } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini-api-key');
    if (savedKey) {
        setApiKey(savedKey);
        setTempApiKey(savedKey);
        initializeAi(savedKey);
    }
  }, []);

  useEffect(() => {
    try {
        const savedData = localStorage.getItem('cv-builder-data');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            // Hydrate the loaded data with defaults to prevent errors from outdated schemas
            const hydratedData = {
                ...initialData,
                ...parsedData,
                personalInfo: {
                    ...initialData.personalInfo,
                    ...(parsedData.personalInfo || {})
                },
                experience: parsedData.experience || [],
                projects: parsedData.projects || [],
                education: parsedData.education || [],
                certifications: parsedData.certifications || [],
            };
            setCvData(hydratedData);
        }
    } catch (error) {
        console.error("Failed to load CV data from localStorage", error);
        localStorage.removeItem('cv-builder-data'); // Clear corrupted data
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
            setIsDownloadMenuOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleApiKeySave = () => {
    localStorage.setItem('gemini-api-key', tempApiKey);
    setApiKey(tempApiKey);
    initializeAi(tempApiKey);
    setShowApiKeySaved(true);
    setTimeout(() => setShowApiKeySaved(false), 2000);
  };

  const handleSave = () => {
    setSaveStatus('saving');
    try {
        localStorage.setItem('cv-builder-data', JSON.stringify(cvData));
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
        console.error("Failed to save CV data to localStorage", error);
        alert('There was an error saving your progress.');
        setSaveStatus('idle');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const reader = new FileReader();

    reader.onload = async (event) => {
        const content = event.target?.result as string;
        try {
            if (fileExtension === 'json') {
                const parsedData = JSON.parse(content);
                // Hydrate the loaded data with defaults to prevent errors from outdated schemas
                const hydratedData = {
                    ...initialData,
                    ...parsedData,
                    personalInfo: {
                        ...initialData.personalInfo,
                        ...(parsedData.personalInfo || {})
                    },
                    experience: parsedData.experience || [],
                    projects: parsedData.projects || [],
                    education: parsedData.education || [],
                    certifications: parsedData.certifications || [],
                };
                setCvData(hydratedData);
            } else if (fileExtension === 'txt') {
                 if (!apiKey) {
                    alert("Please set your Gemini API key to import from a text file.");
                    setIsImporting(false);
                    if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                    }
                    return;
                }
                const parsedData = await parseCVWithAI(content);
                setCvData(parsedData); // parseCVWithAI already ensures arrays exist
            } else {
                 throw new Error("Unsupported file type. Please upload a .txt or .json file.");
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "An unknown error occurred during import.";
            alert(`Import failed: ${message}`);
            console.error(error);
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };
    reader.onerror = () => {
        alert("Failed to read the file.");
        setIsImporting(false);
    };
    reader.readAsText(file);
  };

  const handleDownloadPDF = async () => {
    const cvPreviewElement = document.getElementById('cv-preview');
    if (!cvPreviewElement) return;

    setIsSaving(true);

    // 1. Clone the element to render it off-screen without affecting the user's view.
    const clone = cvPreviewElement.cloneNode(true) as HTMLElement;

    // 2. Programmatically add separator lines for the PDF output.
    const sections = clone.querySelectorAll('section');
    sections.forEach((section, index) => {
        if (index < sections.length - 1) { // Don't add a border to the very last section.
            section.style.paddingBottom = '24px';
            section.style.marginBottom = '24px';
            section.style.borderBottom = '1px solid #e2e8f0'; // slate-200, a thin grey line.
        }
    });

    // 3. Create a temporary, off-screen container to render the clone with fixed dimensions.
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0px';
    container.style.width = '800px'; // A standard width for consistent, high-quality rendering.
    container.style.backgroundColor = 'white';
    container.appendChild(clone);
    document.body.appendChild(container);

    try {
        // 4. Wait for any images inside the clone to fully load before capturing.
        const images = Array.from(clone.getElementsByTagName('img'));
        const promises = images.map(img => {
            if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
            return new Promise<void>(resolve => {
                img.onload = () => resolve();
                img.onerror = () => resolve(); // Don't block generation for a broken image.
            });
        });
        await Promise.all(promises);
        await new Promise(resolve => setTimeout(resolve, 100)); // Brief pause for rendering.

        // 5. Capture the entire clone as one single, long canvas. This is the key to fixing rendering bugs.
        const canvas = await html2canvas(clone, {
            scale: 3, // High scale for crisp text and images.
            useCORS: true,
            backgroundColor: '#ffffff',
            windowWidth: clone.scrollWidth,
            windowHeight: clone.scrollHeight,
        });

        // 6. Create the PDF and slice the single canvas image across multiple pages.
        const pdf = new jsPDF('p', 'mm', 'a4');
        const MARGIN_MM = 15;
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const contentWidth = pdfWidth - MARGIN_MM * 2;
        const contentHeight = pdfHeight - MARGIN_MM * 2;
        
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = contentWidth / imgWidth;

        let yOnCanvas = 0; // The Y position on the source canvas we are slicing from.

        while (yOnCanvas < imgHeight) {
            if (yOnCanvas > 0) {
                pdf.addPage();
            }
            // Calculate the height of the slice to take from the source canvas.
            const sliceHeightOnCanvas = Math.min(imgHeight - yOnCanvas, contentHeight / ratio);
            
            // Create a temporary canvas for the slice.
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = imgWidth;
            tempCanvas.height = sliceHeightOnCanvas;
            const tempCtx = tempCanvas.getContext('2d');

            if (tempCtx) {
                // Draw the slice from the main canvas to the temporary canvas.
                tempCtx.drawImage(canvas, 0, yOnCanvas, imgWidth, sliceHeightOnCanvas, 0, 0, imgWidth, sliceHeightOnCanvas);
                const pageDataUrl = tempCanvas.toDataURL('image/png', 1.0);
                
                // Calculate the height this slice will have on the PDF page.
                const sliceHeightOnPdf = sliceHeightOnCanvas * ratio;

                pdf.addImage(pageDataUrl, 'PNG', MARGIN_MM, MARGIN_MM, contentWidth, sliceHeightOnPdf);
            }
            yOnCanvas += sliceHeightOnCanvas;
        }

        pdf.save(`${(cvData.personalInfo.name || 'cv').replace(/ /g, '_')}.pdf`);

    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("An error occurred while generating the PDF. Please try again.");
    } finally {
        // 7. Clean up by removing the temporary container from the DOM.
        document.body.removeChild(container);
        setIsSaving(false);
    }
  };


  const handleDownloadJSON = () => {
    const jsonData = JSON.stringify(cvData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(cvData.personalInfo.name || 'cv').replace(/ /g, '_')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const convertCVDataToTXT = (data: CVData): string => {
    let txt = '';
    const { personalInfo, summary, experience, projects, education, certifications, skills } = data;
    txt += `${personalInfo.name}\n${personalInfo.title}\n\n`;
    txt += `Contact:\n`;
    if (personalInfo.email) txt += `- Email: ${personalInfo.email}\n`;
    if (personalInfo.phone) txt += `- Phone: ${personalInfo.phone}\n`;
    if (personalInfo.website) txt += `- Website: ${personalInfo.website}\n`;
    if (personalInfo.location) txt += `- Location: ${personalInfo.location}\n\n`;
    if (summary) txt += 'SUMMARY\n--------------------\n' + `${summary}\n\n`;
    if (experience.length > 0) {
      txt += 'WORK EXPERIENCE\n--------------------\n';
      experience.forEach(exp => {
        txt += `${exp.jobTitle} | ${exp.company}\n${exp.startDate} - ${exp.endDate}\n${exp.description.replace(/^-/gm, '  -')}\n\n`;
      });
    }
    if (projects.length > 0) {
      txt += 'PROJECTS\n--------------------\n';
      projects.forEach(proj => {
        txt += `${proj.name}\n`;
        if (proj.link) txt += `Link: ${proj.link}\n`;
        txt += `${proj.description.replace(/^-/gm, '  -')}\n\n`;
      });
    }
    if (skills) txt += 'SKILLS\n--------------------\n' + `${skills}\n\n`;
    if (education.length > 0) {
      txt += 'EDUCATION\n--------------------\n';
      education.forEach(edu => {
        txt += `${edu.degree} | ${edu.institution}\n${edu.startDate} - ${edu.endDate}\n\n`;
      });
    }
    if (certifications.length > 0) {
      txt += 'CERTIFICATIONS\n--------------------\n';
      certifications.forEach(cert => {
        txt += `${cert.name} | ${cert.issuer}\nDate: ${cert.date}\n\n`;
      });
    }
    return txt;
  };

  const handleDownloadTXT = () => {
      const textData = convertCVDataToTXT(cvData);
      const blob = new Blob([textData], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${(cvData.personalInfo.name || 'cv').replace(/ /g, '_')}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };


  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="bg-white shadow-md sticky top-0 z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <h1 className="text-xl md:text-2xl font-bold text-slate-800">
              {t('appTitle')}
            </h1>
            <div className="flex items-center gap-2 md:gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImport}
                accept=".txt,.json"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                title={t('importFromFile')}
                className="hidden sm:flex items-center gap-2 text-sm bg-slate-200 text-slate-700 px-3 py-2 rounded-md hover:bg-slate-300 transition-colors disabled:opacity-50"
              >
                <UploadIcon />
                <span className="hidden md:inline">{isImporting ? t('importing') : t('importFromFile')}</span>
              </button>
              <button
                onClick={() => {
                  if(window.confirm('Are you sure you want to clear the form? All unsaved changes will be lost.')) {
                    setCvData(initialData)
                  }
                }}
                title={t('clearCV')}
                className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 px-3 py-2 rounded-md transition-colors"
              >
                <TrashIcon />
              </button>
               <button
                onClick={handleSave}
                disabled={saveStatus !== 'idle'}
                className="flex items-center gap-2 text-sm bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
              >
                <SaveIcon />
                <span className="hidden md:inline">
                    {saveStatus === 'saved' ? t('saved') : t('save')}
                </span>
              </button>

              <div className="relative" ref={downloadMenuRef}>
                <button
                    onClick={() => setIsDownloadMenuOpen(prev => !prev)}
                    disabled={isSaving}
                    className="flex items-center gap-2 text-sm bg-slate-700 text-white px-3 py-2 rounded-md hover:bg-slate-800 disabled:bg-slate-400 transition-colors"
                >
                    <DownloadIcon />
                    <span className="hidden md:inline">{t('download')}</span>
                    <ChevronDownIcon />
                </button>
                {isDownloadMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-30 ring-1 ring-black ring-opacity-5 origin-top-right transition-all duration-100 ease-out transform opacity-100 scale-100">
                        <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                            <button
                                onClick={() => { handleDownloadPDF(); setIsDownloadMenuOpen(false); }}
                                className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                                role="menuitem"
                                disabled={isSaving}
                            >
                                {isSaving ? t('saving') : t('downloadAsPDF')}
                            </button>
                            <button
                                onClick={() => { handleDownloadJSON(); setIsDownloadMenuOpen(false); }}
                                className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                role="menuitem"
                            >
                                {t('downloadAsJSON')}
                            </button>
                            <button
                                onClick={() => { handleDownloadTXT(); setIsDownloadMenuOpen(false); }}
                                className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                role="menuitem"
                            >
                                {t('downloadAsTXT')}
                            </button>
                        </div>
                    </div>
                )}
              </div>

              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'tr')}
                className="bg-white border border-slate-300 rounded-md py-2 pl-2 pr-7 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition"
              >
                <option value="en">EN</option>
                <option value="tr">TR</option>
              </select>
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-slate-100 p-4 rounded-lg mb-8 border border-slate-200 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                    <WrenchIcon />
                    <h2 className="font-semibold text-slate-700">Gemini API Key</h2>
                    {apiKey ? (
                        <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full">Saved</span>
                    ) : (
                        <span className="text-xs bg-yellow-100 text-yellow-700 font-medium px-2 py-0.5 rounded-full">Required for AI Features</span>
                    )}
                </div>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                    Get your API Key from Google AI Studio
                </a>
            </div>
            <p className="text-sm text-slate-500 mt-2 mb-3">
                Your key is saved only in your browser's local storage and is never sent to any servers.
            </p>
            <div className="flex gap-2">
                <input
                    type="password"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder="Paste your Gemini API key here"
                    className="flex-grow w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition"
                    aria-label="Gemini API Key Input"
                />
                <button
                    onClick={handleApiKeySave}
                    className="flex-shrink-0 text-sm bg-slate-600 text-white px-4 py-2 rounded-md hover:bg-slate-700 disabled:bg-slate-400 transition-colors"
                    disabled={!tempApiKey}
                >
                    {showApiKeySaved ? 'Saved!' : 'Save Key'}
                </button>
            </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="bg-white p-6 rounded-xl shadow-lg">
             <CVForm cvData={cvData} setCvData={setCvData} isAiEnabled={!!apiKey} />
          </div>
          <div className="lg:sticky top-24 self-start">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div id="cv-preview-container" className="h-[calc(100vh-8rem)] overflow-y-auto">
                    <CVPreview cvData={cvData} />
                </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


const App: React.FC = () => {
    return (
        <LanguageProvider>
            <AppContent />
        </LanguageProvider>
    )
}

export default App;
