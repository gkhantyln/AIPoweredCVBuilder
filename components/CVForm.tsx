
import React, { useState, useRef } from 'react';
import type { CVData, PersonalInfo, Experience, Education, Certification, Project } from '../types';
import { enhanceTextWithAI, translateTextWithAI } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { GraduationCapIcon } from './icons/GraduationCapIcon';
import { WrenchIcon } from './icons/WrenchIcon';
import { UserIcon } from './icons/UserIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { CertificateIcon } from './icons/CertificateIcon';
import { LightbulbIcon } from './icons/LightbulbIcon';
import { useLanguage } from '../contexts/LanguageContext';
import { TranslateIcon } from './icons/TranslateIcon';

interface CVFormProps {
  cvData: CVData;
  setCvData: React.Dispatch<React.SetStateAction<CVData>>;
  isAiEnabled: boolean;
}

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="bg-white p-6 rounded-lg shadow-md mb-6">
    <h2 className="text-xl font-semibold text-slate-700 mb-4 flex items-center gap-3">
      {icon}
      {title}
    </h2>
    {children}
  </div>
);

const InputField: React.FC<{ label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string, type?: string }> = ({ label, name, value, onChange, placeholder, type = "text" }) => (
  <div className="mb-4">
    <label htmlFor={name} className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition"
    />
  </div>
);

const TextAreaWithAI: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; onEnhanced: (newValue: string) => void; prompt: string; isAiEnabled: boolean; placeholder?: string; rows?: number; }> = ({ label, value, onChange, onEnhanced, prompt, isAiEnabled, placeholder, rows = 4 }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  const handleEnhance = async () => {
    setIsLoading(true);
    setError(null);
    const result = await enhanceTextWithAI(prompt, value);
    if (result.startsWith("Error:")) {
      setError(result);
    } else {
      onEnhanced(result);
    }
    setIsLoading(false);
  };
  
  const handleTranslate = async () => {
    setIsTranslating(true);
    setError(null);
    const result = await translateTextWithAI(value);
    if (result.startsWith("Error:")) {
      setError(result);
    } else {
      onEnhanced(result);
    }
    setIsTranslating(false);
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <label className="block text-sm font-medium text-slate-600">{label}</label>
        <div className="flex items-center gap-3">
            <button 
              onClick={handleEnhance} 
              disabled={!isAiEnabled || isLoading || isTranslating || !value} 
              className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title={!isAiEnabled ? "Please set your Gemini API key to use AI features." : t('enhanceWithAI')}
            >
              <SparklesIcon />
              {isLoading ? t('enhancing') : t('enhanceWithAI')}
            </button>
            <button 
              onClick={handleTranslate} 
              disabled={!isAiEnabled || isTranslating || isLoading || !value} 
              className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title={!isAiEnabled ? "Please set your Gemini API key to use AI features." : t('translateToTurkish')}
            >
              <TranslateIcon />
              {isTranslating ? t('translating') : t('translateToTurkish')}
            </button>
        </div>
      </div>
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition"
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};


const PersonalInfoSection: React.FC<{ personalInfo: PersonalInfo; setCvData: React.Dispatch<React.SetStateAction<CVData>> }> = ({ personalInfo, setCvData }) => {
  const { t } = useLanguage();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCvData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [name]: value }
    }));
  };
  
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (event) => {
            setCvData(prev => ({
                ...prev,
                personalInfo: { ...prev.personalInfo, photo: event.target?.result as string }
            }));
        };
        reader.readAsDataURL(e.target.files[0]);
    }
  };

  const removePhoto = () => {
    setCvData(prev => ({
        ...prev,
        personalInfo: { ...prev.personalInfo, photo: null }
    }));
    if(photoInputRef.current) {
        photoInputRef.current.value = "";
    }
  }

  return (
    <Section title={t('personalInfo')} icon={<UserIcon />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            <div>
                <InputField label={t('fullName')} name="name" value={personalInfo.name} onChange={handleChange} placeholder={t('namePlaceholder')} />
                <InputField label={t('jobTitle')} name="title" value={personalInfo.title} onChange={handleChange} placeholder={t('jobTitlePlaceholder')} />
                <InputField label={t('email')} name="email" value={personalInfo.email} onChange={handleChange} placeholder={t('emailPlaceholder')} type="email" />
                <InputField label={t('phone')} name="phone" value={personalInfo.phone} onChange={handleChange} placeholder={t('phonePlaceholder')} type="tel" />
                <InputField label={t('website')} name="website" value={personalInfo.website} onChange={handleChange} placeholder={t('websitePlaceholder')} />
                <InputField label={t('location')} name="location" value={personalInfo.location} onChange={handleChange} placeholder={t('locationPlaceholder')} />
            </div>
            <div className="flex flex-col items-center justify-center bg-slate-50 rounded-lg p-4 h-full">
                <input type="file" accept="image/*" ref={photoInputRef} onChange={handlePhotoChange} className="hidden" />
                {personalInfo.photo ? (
                    <img src={personalInfo.photo} alt="Profile" className="w-32 h-32 rounded-full object-cover mb-4" />
                ) : (
                    <div className="w-32 h-32 rounded-full bg-slate-200 flex items-center justify-center mb-4">
                        <UserIcon />
                    </div>
                )}
                <button onClick={() => photoInputRef.current?.click()} className="text-sm bg-slate-200 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-300 transition-colors w-40 mb-2">
                    {personalInfo.photo ? t('changePhoto') : t('uploadPhoto')}
                </button>
                {personalInfo.photo && (
                    <button onClick={removePhoto} className="text-sm text-red-500 hover:text-red-700 transition-colors w-40">
                       {t('removePhoto')}
                    </button>
                )}
            </div>
        </div>
    </Section>
  );
};

const SummarySection: React.FC<{ summary: string; setCvData: React.Dispatch<React.SetStateAction<CVData>>; isAiEnabled: boolean; }> = ({ summary, setCvData, isAiEnabled }) => {
  const { t } = useLanguage();
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCvData(prev => ({ ...prev, summary: e.target.value }));
  };

  const handleEnhanced = (newValue: string) => {
    setCvData(prev => ({ ...prev, summary: newValue }));
  };
  
  const prompt = "Rewrite the following professional summary to be more impactful and professional. Focus on quantifiable achievements and strong action verbs. Keep it concise, ideally 3-4 sentences long.";

  return (
    <Section title={t('summary')} icon={<DocumentTextIcon />}>
      <TextAreaWithAI
        label={t('summaryLabel')}
        value={summary}
        onChange={handleChange}
        onEnhanced={handleEnhanced}
        prompt={prompt}
        placeholder={t('summaryPlaceholder')}
        rows={5}
        isAiEnabled={isAiEnabled}
      />
    </Section>
  );
};

const ExperienceSection: React.FC<{ experience: Experience[]; setCvData: React.Dispatch<React.SetStateAction<CVData>>; isAiEnabled: boolean; }> = ({ experience, setCvData, isAiEnabled }) => {
  const { t } = useLanguage();

  const handleChange = (id: string, field: keyof Experience, value: string) => {
    setCvData(prev => ({
      ...prev,
      experience: prev.experience.map(exp => exp.id === id ? { ...exp, [field]: value } : exp)
    }));
  };
  
  const handleEnhanced = (id: string, newValue: string) => {
    setCvData(prev => ({
      ...prev,
      experience: prev.experience.map(exp => exp.id === id ? { ...exp, description: newValue } : exp)
    }));
  };
  
  const addExperience = () => {
    const newExp: Experience = { id: Date.now().toString(), jobTitle: '', company: '', startDate: '', endDate: '', description: '' };
    setCvData(prev => ({ ...prev, experience: [...prev.experience, newExp] }));
  };
  
  const removeExperience = (id: string) => {
    setCvData(prev => ({ ...prev, experience: prev.experience.filter(exp => exp.id !== id) }));
  };

  const prompt = "Rewrite the following job responsibility bullet points into professional, action-oriented statements for a resume. Start each point with a strong action verb and focus on achievements and results. Ensure the output is formatted as bullet points (using hyphens).";

  return (
    <Section title={t('experience')} icon={<BriefcaseIcon />}>
      {experience.map(exp => (
        <div key={exp.id} className="p-4 border border-slate-200 rounded-md mb-4 relative">
            <button onClick={() => removeExperience(exp.id)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors">
                <TrashIcon />
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <InputField label={t('jobTitle')} name="jobTitle" value={exp.jobTitle} onChange={e => handleChange(exp.id, 'jobTitle', e.target.value)} />
                <InputField label={t('company')} name="company" value={exp.company} onChange={e => handleChange(exp.id, 'company', e.target.value)} />
                <InputField label={t('startDate')} name="startDate" value={exp.startDate} onChange={e => handleChange(exp.id, 'startDate', e.target.value)} placeholder={t('startDatePlaceholder')} />
                <InputField label={t('endDate')} name="endDate" value={exp.endDate} onChange={e => handleChange(exp.id, 'endDate', e.target.value)} placeholder={t('endDatePlaceholder')} />
            </div>
            <TextAreaWithAI
                label={t('description')}
                value={exp.description}
                onChange={e => handleChange(exp.id, 'description', e.target.value)}
                onEnhanced={(newValue) => handleEnhanced(exp.id, newValue)}
                prompt={prompt}
                placeholder={t('descriptionPlaceholder')}
                rows={5}
                isAiEnabled={isAiEnabled}
            />
        </div>
      ))}
      <button onClick={addExperience} className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-slate-300 text-slate-600 rounded-md hover:border-slate-500 hover:text-slate-800 transition-colors">
        <PlusIcon />
        {t('addExperience')}
      </button>
    </Section>
  );
};

const ProjectsSection: React.FC<{ projects: Project[]; setCvData: React.Dispatch<React.SetStateAction<CVData>>; isAiEnabled: boolean; }> = ({ projects, setCvData, isAiEnabled }) => {
  const { t } = useLanguage();

  const handleChange = (id: string, field: keyof Project, value: string) => {
    setCvData(prev => ({
      ...prev,
      projects: prev.projects.map(proj => proj.id === id ? { ...proj, [field]: value } : proj)
    }));
  };
  
  const handleEnhanced = (id: string, newValue: string) => {
    setCvData(prev => ({
      ...prev,
      projects: prev.projects.map(proj => proj.id === id ? { ...proj, description: newValue } : proj)
    }));
  };
  
  const addProject = () => {
    const newProj: Project = { id: Date.now().toString(), name: '', link: '', description: '' };
    setCvData(prev => ({ ...prev, projects: [...prev.projects, newProj] }));
  };
  
  const removeProject = (id: string) => {
    setCvData(prev => ({ ...prev, projects: prev.projects.filter(proj => proj.id !== id) }));
  };

  const prompt = "Rewrite the following project description for a resume. Focus on the technologies used, the problem solved, and the outcome. Use action-oriented language and format the output as bullet points (using hyphens).";

  return (
    <Section title={t('projects')} icon={<LightbulbIcon />}>
      {projects.map(proj => (
        <div key={proj.id} className="p-4 border border-slate-200 rounded-md mb-4 relative">
            <button onClick={() => removeProject(proj.id)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors">
                <TrashIcon />
            </button>
            <InputField label={t('projectName')} name="name" value={proj.name} onChange={e => handleChange(proj.id, 'name', e.target.value)} placeholder={t('projectNamePlaceholder')} />
            <InputField label={t('projectLink')} name="link" value={proj.link} onChange={e => handleChange(proj.id, 'link', e.target.value)} placeholder={t('projectLinkPlaceholder')} />
            <TextAreaWithAI
                label={t('description')}
                value={proj.description}
                onChange={e => handleChange(proj.id, 'description', e.target.value)}
                onEnhanced={(newValue) => handleEnhanced(proj.id, newValue)}
                prompt={prompt}
                placeholder={t('projectDescriptionPlaceholder')}
                rows={4}
                isAiEnabled={isAiEnabled}
            />
        </div>
      ))}
      <button onClick={addProject} className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-slate-300 text-slate-600 rounded-md hover:border-slate-500 hover:text-slate-800 transition-colors">
        <PlusIcon />
        {t('addProject')}
      </button>
    </Section>
  );
};

const EducationSection: React.FC<{ education: Education[]; setCvData: React.Dispatch<React.SetStateAction<CVData>> }> = ({ education, setCvData }) => {
    const { t } = useLanguage();
    
    const handleChange = (id: string, field: keyof Education, value: string) => {
        setCvData(prev => ({
          ...prev,
          education: prev.education.map(edu => edu.id === id ? { ...edu, [field]: value } : edu)
        }));
    };
    
    const addEducation = () => {
        const newEdu: Education = { id: Date.now().toString(), degree: '', institution: '', startDate: '', endDate: '' };
        setCvData(prev => ({ ...prev, education: [...prev.education, newEdu] }));
    };

    const removeEducation = (id: string) => {
        setCvData(prev => ({ ...prev, education: prev.education.filter(edu => edu.id !== id) }));
    };

    return (
        <Section title={t('education')} icon={<GraduationCapIcon />}>
             {education.map(edu => (
                <div key={edu.id} className="p-4 border border-slate-200 rounded-md mb-4 relative">
                    <button onClick={() => removeEducation(edu.id)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors">
                        <TrashIcon />
                    </button>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                        <InputField label={t('degreeCertificate')} name="degree" value={edu.degree} onChange={e => handleChange(edu.id, 'degree', e.target.value)} />
                        <InputField label={t('institution')} name="institution" value={edu.institution} onChange={e => handleChange(edu.id, 'institution', e.target.value)} />
                        <InputField label={t('startDate')} name="startDate" value={edu.startDate} onChange={e => handleChange(edu.id, 'startDate', e.target.value)} placeholder={t('startDateEduPlaceholder')} />
                        <InputField label={t('endDate')} name="endDate" value={edu.endDate} onChange={e => handleChange(edu.id, 'endDate', e.target.value)} placeholder={t('endDateEduPlaceholder')} />
                    </div>
                </div>
            ))}
            <button onClick={addEducation} className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-slate-300 text-slate-600 rounded-md hover:border-slate-500 hover:text-slate-800 transition-colors">
                <PlusIcon />
                {t('addEducation')}
            </button>
        </Section>
    );
};

const CertificationsSection: React.FC<{ certifications: Certification[]; setCvData: React.Dispatch<React.SetStateAction<CVData>> }> = ({ certifications, setCvData }) => {
    const { t } = useLanguage();

    const handleChange = (id: string, field: keyof Certification, value: string) => {
        setCvData(prev => ({
          ...prev,
          certifications: prev.certifications.map(cert => cert.id === id ? { ...cert, [field]: value } : cert)
        }));
    };

    const addCertification = () => {
        const newCert: Certification = { id: Date.now().toString(), name: '', issuer: '', date: '' };
        setCvData(prev => ({ ...prev, certifications: [...prev.certifications, newCert] }));
    };

    const removeCertification = (id: string) => {
        setCvData(prev => ({ ...prev, certifications: prev.certifications.filter(cert => cert.id !== id) }));
    };

    return (
        <Section title={t('certifications')} icon={<CertificateIcon />}>
            {certifications.map(cert => (
                <div key={cert.id} className="p-4 border border-slate-200 rounded-md mb-4 relative">
                    <button onClick={() => removeCertification(cert.id)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors">
                        <TrashIcon />
                    </button>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                        <InputField label={t('certificationName')} name="name" value={cert.name} onChange={e => handleChange(cert.id, 'name', e.target.value)} placeholder={t('certNamePlaceholder')} />
                        <InputField label={t('issuingOrg')} name="issuer" value={cert.issuer} onChange={e => handleChange(cert.id, 'issuer', e.target.value)} placeholder={t('issuerPlaceholder')} />
                    </div>
                    <InputField label={t('date')} name="date" value={cert.date} onChange={e => handleChange(cert.id, 'date', e.target.value)} placeholder={t('datePlaceholder')} />
                </div>
            ))}
            <button onClick={addCertification} className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-slate-300 text-slate-600 rounded-md hover:border-slate-500 hover:text-slate-800 transition-colors">
                <PlusIcon />
                {t('addCertification')}
            </button>
        </Section>
    );
};

const SkillsSection: React.FC<{ skills: string; setCvData: React.Dispatch<React.SetStateAction<CVData>>; isAiEnabled: boolean; }> = ({ skills, setCvData, isAiEnabled }) => {
    const { t } = useLanguage();
    
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCvData(prev => ({ ...prev, skills: e.target.value }));
    };

    const handleEnhanced = (newValue: string) => {
        setCvData(prev => ({ ...prev, skills: newValue }));
    };
    
    const prompt = "Review the following comma-separated list of skills. Organize them into logical categories (e.g., Programming Languages, Frameworks, Tools), remove duplicates, and suggest related, high-demand skills to add. Keep the final output as a single, clean, comma-separated list.";

    return (
        <Section title={t('skills')} icon={<WrenchIcon />}>
             <TextAreaWithAI
                label={t('skillsLabel')}
                value={skills}
                onChange={handleChange}
                onEnhanced={handleEnhanced}
                prompt={prompt}
                placeholder={t('skillsPlaceholder')}
                rows={4}
                isAiEnabled={isAiEnabled}
            />
            <p className="text-xs text-slate-500 mt-1">{t('skillsHint')}</p>
        </Section>
    );
};


const CVForm: React.FC<CVFormProps> = ({ cvData, setCvData, isAiEnabled }) => {
  return (
    <div>
      <PersonalInfoSection personalInfo={cvData.personalInfo} setCvData={setCvData} />
      <SummarySection summary={cvData.summary} setCvData={setCvData} isAiEnabled={isAiEnabled} />
      <ExperienceSection experience={cvData.experience} setCvData={setCvData} isAiEnabled={isAiEnabled} />
      <ProjectsSection projects={cvData.projects} setCvData={setCvData} isAiEnabled={isAiEnabled} />
      <EducationSection education={cvData.education} setCvData={setCvData} />
      <CertificationsSection certifications={cvData.certifications} setCvData={setCvData} />
      <SkillsSection skills={cvData.skills} setCvData={setCvData} isAiEnabled={isAiEnabled} />
    </div>
  );
};

export default CVForm;
