
import React, { useState } from 'react';
import type { CVData } from '../types';
import CVPreview, { PdfSettings } from './CVPreview';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface PDFCustomizerProps {
  cvData: CVData;
  onBack: () => void;
}

const PDFCustomizer: React.FC<PDFCustomizerProps> = ({ cvData, onBack }) => {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<PdfSettings>({ fontScale: 1.0 });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPDF = async () => {
    const cvPreviewElement = document.getElementById('cv-preview');
    if (!cvPreviewElement) return;

    setIsGenerating(true);

    const clone = cvPreviewElement.cloneNode(true) as HTMLElement;

    const sections = clone.querySelectorAll('section');
    sections.forEach((section, index) => {
        if (index < sections.length - 1) {
            section.style.paddingBottom = '24px';
            section.style.marginBottom = '24px';
            section.style.borderBottom = '1px solid #e2e8f0';
        }
    });

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0px';
    container.style.width = '800px';
    container.style.backgroundColor = 'white';
    container.appendChild(clone);
    document.body.appendChild(container);

    try {
        const images = Array.from(clone.getElementsByTagName('img'));
        const promises = images.map(img => {
            if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
            return new Promise<void>(resolve => {
                img.onload = () => resolve();
                img.onerror = () => resolve();
            });
        });
        await Promise.all(promises);
        await new Promise(resolve => setTimeout(resolve, 100));

        const canvas = await html2canvas(clone, {
            scale: 3,
            useCORS: true,
            backgroundColor: '#ffffff',
            windowWidth: clone.scrollWidth,
            windowHeight: clone.scrollHeight,
        });

        const pdf = new jsPDF('p', 'mm', 'a4');
        const MARGIN_MM = 15;
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const contentWidth = pdfWidth - MARGIN_MM * 2;
        const contentHeight = pdfHeight - MARGIN_MM * 2;
        
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = contentWidth / imgWidth;

        let yOnCanvas = 0;

        while (yOnCanvas < imgHeight) {
            if (yOnCanvas > 0) {
                pdf.addPage();
            }
            const sliceHeightOnCanvas = Math.min(imgHeight - yOnCanvas, contentHeight / ratio);
            
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = imgWidth;
            tempCanvas.height = sliceHeightOnCanvas;
            const tempCtx = tempCanvas.getContext('2d');

            if (tempCtx) {
                tempCtx.drawImage(canvas, 0, yOnCanvas, imgWidth, sliceHeightOnCanvas, 0, 0, imgWidth, sliceHeightOnCanvas);
                const pageDataUrl = tempCanvas.toDataURL('image/png', 1.0);
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
        document.body.removeChild(container);
        setIsGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* Controls */}
      <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg h-fit sticky top-24">
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800">{t('customizePDFTitle')}</h2>
            <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">
                <ArrowLeftIcon />
                {t('backToEditor')}
            </button>
        </div>
        
        <div className="mb-6">
          <label htmlFor="fontScale" className="block text-sm font-medium text-slate-600 mb-2">
            {t('fontSize')} ({Math.round(settings.fontScale * 100)}%)
          </label>
          <input 
            type="range" 
            id="fontScale" 
            min="0.8" 
            max="1.2" 
            step="0.01" 
            value={settings.fontScale} 
            onChange={e => setSettings(s => ({ ...s, fontScale: parseFloat(e.target.value) }))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <button 
          onClick={handleDownloadPDF} 
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors shadow-md"
        >
          <DownloadIcon />
          {isGenerating ? t('generating') : t('generateAndDownload')}
        </button>
      </div>

      {/* Preview */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="h-[calc(100vh-8rem)] overflow-y-auto" id="pdf-preview-container">
            <CVPreview cvData={cvData} pdfSettings={settings} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFCustomizer;
