
import React, { useState, useRef, useEffect } from 'react';
import CVForm from './components/CVForm';
import CVPreview from './components/CVPreview';
import { CVData } from './types';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { DownloadIcon } from './components/icons/DownloadIcon';
import { UploadIcon } from './components/icons/UploadIcon';
import { TrashIcon } from './components/icons/TrashIcon';
import { SaveIcon } from './components/icons/SaveIcon';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { parseCVWithAI } from './services/geminiService';

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
  const { t, setLanguage, language } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);


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

  const handleDownloadPDF = () => {
    const cvElement = document.getElementById('cv-preview');
    if (cvElement) {
        setIsSaving(true);
        html2canvas(cvElement, { scale: 3, useCORS: true }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4', true);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;

            while (heightLeft > 0) {
                position -= pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pdfHeight;
            }
            
            pdf.save(`${(cvData.personalInfo.name || 'cv').replace(/ /g, '_')}.pdf`);
            setIsSaving(false);
        }).catch(err => {
            console.error("Error generating PDF:", err);
            setIsSaving(false);
        });
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="bg-white p-6 rounded-xl shadow-lg">
             <CVForm cvData={cvData} setCvData={setCvData} />
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
