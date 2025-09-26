
import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { analyzeCVWithAI, AnalysisResult } from '../services/geminiService';
import { UploadIcon } from './icons/UploadIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { ChevronUpIcon } from './icons/ChevronUpIcon';
import type { CVData } from '../types';

interface CVAnalyzerProps {
    isAiEnabled: boolean;
}

const systemPromptText = `You are an advanced CV/Resume evaluation expert specializing in the Turkish job market. You assess CVs for both online applications (LinkedIn, Kariyer.net, etc.) and traditional hiring processes. Your tasks are:

1.  Analyze the CV/resume thoroughly, section by section.
2.  Automatically score the CV from 0 to 100 based on overall quality, readability, relevance to the target position, and Turkish market standards.
3.  Identify missing, incorrect, or poorly formatted information.
4.  Provide detailed section-based feedback:
    *   **Personal Information**: completeness, format, professionalism.
    *   **Education**: clarity, relevance, order, degree accuracy.
    *   **Work Experience**: clarity, achievements highlighted, results-focused.
    *   **Skills & Technologies**: relevance to position, presentation, proficiency indication.
    *   **Projects / Portfolio**: impact, clarity, relevance.
    *   **References / Additional Info**: optional but valuable additions.
5.  Give actionable improvement suggestions per section and general recommendations for enhancing impact and ATS (Applicant Tracking System) compatibility.
6.  Provide industry/sector-specific advice if the CV is for tech, finance, healthcare, or other domains.
7.  Output in a clear, structured JSON format. Always align your feedback with best hiring practices in Turkey, and make it practical, concise, and actionable. Consider readability, ATS optimization, and relevance to the target position.
`;

const CVAnalyzer: React.FC<CVAnalyzerProps> = ({ isAiEnabled }) => {
    const { t, language } = useLanguage();
    const [cvContent, setCvContent] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState<string>('');
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isPromptVisible, setIsPromptVisible] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [analysisLanguage, setAnalysisLanguage] = useState<'en' | 'tr'>(language);

    useEffect(() => {
        setAnalysisLanguage(language);
    }, [language]);

    const handleFileChange = (file: File | null) => {
        if (file) {
            if (file.type === 'application/json') {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setCvContent(e.target?.result as string);
                    setFileName(file.name);
                    setError(null);
                    setAnalysisResult(null);
                };
                reader.readAsText(file);
            } else {
                setError('Please upload a valid JSON file.');
            }
        }
    };

    const handleDragEvents = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragEnter = (e: React.DragEvent) => {
        handleDragEvents(e);
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        handleDragEvents(e);
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        handleDragEvents(e);
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFileChange(file);
        }
    };

    const handleAnalyze = async () => {
        if (!cvContent) {
            setError('Please import a CV file first.');
            return;
        }
        if (!isAiEnabled) {
            setError('Please set your Gemini API key in the settings to use this feature.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);
        setProgress('Starting analysis...');
        try {
            const result = await analyzeCVWithAI(cvContent, analysisLanguage, (message) => {
                setProgress(message);
            });
            setAnalysisResult(result);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Analysis failed: ${message}`);
        } finally {
            setIsLoading(false);
            setProgress('');
        }
    };

    const ScoreCircle: React.FC<{ score: number }> = ({ score }) => {
        const circumference = 2 * Math.PI * 52; // 2 * pi * r
        const offset = circumference - (score / 100) * circumference;

        let strokeColor = 'stroke-red-500';
        if (score >= 85) strokeColor = 'stroke-green-500';
        else if (score >= 60) strokeColor = 'stroke-yellow-500';

        return (
            <div className="relative flex items-center justify-center w-32 h-32">
                <svg className="w-full h-full" viewBox="0 0 120 120">
                    <circle
                        className="text-slate-200"
                        strokeWidth="10"
                        stroke="currentColor"
                        fill="transparent"
                        r="52"
                        cx="60"
                        cy="60"
                    />
                    <circle
                        className={`${strokeColor} transition-all duration-1000 ease-in-out`}
                        strokeWidth="10"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="52"
                        cx="60"
                        cy="60"
                        transform="rotate(-90 60 60)"
                    />
                </svg>
                <span className="absolute text-3xl font-bold text-slate-700">{score}</span>
            </div>
        );
    };
    
    const ResultCard: React.FC<{title: string; children: React.ReactNode;}> = ({title, children}) => (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-slate-700 mb-3">{title}</h3>
            {children}
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-4xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800">{t('analyzerTitle')}</h2>
                <p className="text-slate-500 mt-2">{t('analyzerDescription')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div 
                    className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300'}`}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragEvents}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <UploadIcon />
                    <button onClick={() => fileInputRef.current?.click()} className="mt-2 text-blue-600 font-semibold hover:underline">
                       {t('importYourCV')}
                    </button>
                    <p className="text-sm text-slate-500 mt-1">{t('orDragAndDrop')}</p>
                    <input type="file" ref={fileInputRef} onChange={(e) => handleFileChange(e.target.files?.[0] || null)} accept=".json" className="hidden" />
                    {fileName && <p className="text-sm text-slate-600 mt-2 font-medium bg-slate-100 px-2 py-1 rounded">{fileName}</p>}
                </div>
                <div className="flex flex-col justify-center">
                    <button
                        onClick={handleAnalyze}
                        disabled={!cvContent || isLoading || !isAiEnabled}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors shadow-md"
                    >
                        <SparklesIcon />
                        {isLoading ? t('analyzing') : t('analyze')}
                    </button>
                    {!isAiEnabled && <p className="text-xs text-yellow-600 mt-2 text-center">Please provide your API key in the settings to enable analysis.</p>}
                </div>
            </div>

            <div className="mb-8">
                <label className="block text-sm font-medium text-slate-700 mb-2 text-center">{t('analysisLanguageLabel')}</label>
                <div className="flex justify-center">
                    <div className="flex rounded-md bg-slate-100 p-1 border border-slate-200" role="group">
                        <button
                            onClick={() => setAnalysisLanguage('en')}
                            className={`px-4 py-1 text-sm font-semibold rounded-md transition-all ${analysisLanguage === 'en' ? 'bg-white text-slate-800 shadow-sm' : 'bg-transparent text-slate-600 hover:bg-slate-200'}`}
                            aria-pressed={analysisLanguage === 'en'}
                        >
                            English
                        </button>
                        <button
                            onClick={() => setAnalysisLanguage('tr')}
                            className={`px-4 py-1 text-sm font-semibold rounded-md transition-all ${analysisLanguage === 'tr' ? 'bg-white text-slate-800 shadow-sm' : 'bg-transparent text-slate-600 hover:bg-slate-200'}`}
                             aria-pressed={analysisLanguage === 'tr'}
                        >
                            Türkçe
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-8">
                <button onClick={() => setIsPromptVisible(p => !p)} className="flex justify-between items-center w-full font-semibold text-slate-700">
                    <span>{t('systemPrompt')}</span>
                    {isPromptVisible ? <ChevronUpIcon /> : <ChevronDownIcon />}
                </button>
                {isPromptVisible && (
                    <>
                        <p className="text-sm text-slate-500 mt-2 mb-3">{t('promptDescription')}</p>
                        <pre className="bg-slate-200 text-slate-800 p-3 rounded-md text-xs whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
                            <code>{systemPromptText}</code>
                        </pre>
                    </>
                )}
            </div>

            {error && <p className="text-red-500 text-center font-medium mb-6">{error}</p>}
            
            {isLoading && (
                <div className="flex flex-col items-center justify-center p-10">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-slate-600 font-medium">{progress || t('analyzing')}</p>
                </div>
            )}

            {analysisResult && (
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-center text-slate-800 mb-4">{t('analysisResults')}</h2>
                    <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center">
                        <h3 className="text-lg font-semibold text-slate-700 mb-2">{t('overallScore')}</h3>
                        <ScoreCircle score={analysisResult.overallScore} />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ResultCard title={t('strengths')}>
                            <ul className="list-disc list-inside space-y-2 text-slate-600 text-sm">
                                {analysisResult.strengths.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </ResultCard>
                        <ResultCard title={t('weaknesses')}>
                            <ul className="list-disc list-inside space-y-2 text-slate-600 text-sm">
                                {analysisResult.weaknesses.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </ResultCard>
                    </div>

                    <ResultCard title={t('sectionSuggestions')}>
                        <div className="space-y-4">
                            {analysisResult.sectionBasedSuggestions.map((item, i) => (
                                <div key={i} className="p-3 bg-slate-50 rounded-md border border-slate-200">
                                    <p className="font-semibold text-slate-700 text-sm">{item.section}</p>
                                    <p className="text-slate-600 text-sm mt-1">{item.feedback}</p>
                                </div>
                            ))}
                        </div>
                    </ResultCard>

                     <ResultCard title={t('industryRecommendations')}>
                        <ul className="list-disc list-inside space-y-2 text-slate-600 text-sm">
                            {analysisResult.industrySpecificRecommendations.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </ResultCard>

                     <ResultCard title={t('generalAdvice')}>
                        <ul className="list-disc list-inside space-y-2 text-slate-600 text-sm">
                            {analysisResult.generalImprovementAdvice.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </ResultCard>
                </div>
            )}

        </div>
    );
};

export default CVAnalyzer;
