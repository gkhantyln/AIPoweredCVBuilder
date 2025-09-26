import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { BuilderIcon } from './icons/BuilderIcon';
import { ClipboardCheckIcon } from './icons/ClipboardCheckIcon';

type View = 'builder' | 'analyzer';

interface FooterProps {
    activeView: View;
    setActiveView: (view: View) => void;
}

const Footer: React.FC<FooterProps> = ({ activeView, setActiveView }) => {
    const { t } = useLanguage();

    const navItems = [
        { id: 'builder', label: t('cvBuilder'), icon: <BuilderIcon /> },
        { id: 'analyzer', label: t('cvAnalyzer'), icon: <ClipboardCheckIcon /> }
    ];

    return (
        <footer className="fixed bottom-0 left-0 right-0 bg-white shadow-top z-30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-center items-center h-16 gap-4">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveView(item.id as View)}
                            className={`flex flex-col sm:flex-row items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors w-36
                                ${activeView === item.id 
                                    ? 'bg-slate-100 text-slate-800' 
                                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                                }`}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </footer>
    );
};

export default Footer;
