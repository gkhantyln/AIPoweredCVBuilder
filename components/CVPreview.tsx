
import React from 'react';
import type { CVData } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

export interface PdfSettings {
  fontScale: number;
}

interface CVPreviewProps {
  cvData: CVData;
  pdfSettings?: PdfSettings;
}

const CVPreview: React.FC<CVPreviewProps> = ({ cvData, pdfSettings }) => {
  const { personalInfo, summary, experience, projects, education, certifications, skills } = cvData;
  const { t } = useLanguage();
  const fontScale = pdfSettings?.fontScale ?? 1;

  const getStyle = (baseRem: number) => ({
      fontSize: `${baseRem * fontScale}rem`,
      lineHeight: `${baseRem * fontScale * 1.5}rem`
  });
  
  const getSmallStyle = (baseRem: number) => ({
      fontSize: `${baseRem * fontScale}rem`,
      lineHeight: `${baseRem * fontScale * 1.6}rem`
  });


  const renderDescription = (text: string) => {
    return text.split('\n').map((item, key) => (
      <li key={key} className="text-slate-600 mb-1 pl-1 leading-relaxed" style={getSmallStyle(0.875)}>
        {item.replace(/^-/, '').trim()}
      </li>
    ));
  };
  
  return (
    <div id="cv-preview" className="p-8 md:p-12 bg-white text-slate-800 min-h-full">
      {/* Header */}
      <header className={`flex items-center mb-10 gap-x-8 ${!personalInfo.photo && 'justify-center'}`}>
        {personalInfo.photo && (
            <img src={personalInfo.photo} alt={personalInfo.name} className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover shadow-md" />
        )}
        <div className={personalInfo.photo ? 'text-left' : 'text-center'}>
            <h1 className="text-4xl font-bold text-slate-800 tracking-tight" style={getStyle(2.25)}>{personalInfo.name}</h1>
            <p className="text-lg text-slate-600 mt-1" style={getStyle(1.125)}>{personalInfo.title}</p>
            <div className={`flex justify-start items-center gap-x-4 gap-y-1 mt-4 text-slate-500 flex-wrap ${!personalInfo.photo && 'justify-center'}`}>
              <span style={getSmallStyle(0.875)}>{personalInfo.email}</span>
              {personalInfo.phone && <span className="text-slate-300">&bull;</span>}
              <span style={getSmallStyle(0.875)}>{personalInfo.phone}</span>
              {personalInfo.website && <span className="text-slate-300">&bull;</span>}
              <span style={getSmallStyle(0.875)}>{personalInfo.website}</span>
              {personalInfo.location && <span className="text-slate-300">&bull;</span>}
              <span style={getSmallStyle(0.875)}>{personalInfo.location}</span>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="space-y-8">
        {/* Summary */}
        {summary && (
        <section>
          <h2 className="text-xl font-semibold border-b-2 border-slate-200 pb-2 mb-3 text-slate-700" style={getStyle(1.25)}>
            {t('previewSummary')}
          </h2>
          <p className="text-slate-600 leading-relaxed" style={getSmallStyle(0.875)}>{summary}</p>
        </section>
        )}

        {/* Experience */}
        {experience.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold border-b-2 border-slate-200 pb-2 mb-4 text-slate-700" style={getStyle(1.25)}>
            {t('previewExperience')}
          </h2>
          <div className="space-y-6">
            {experience.map(exp => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline">
                  <h3 className="text-md font-semibold text-slate-800" style={getStyle(1)}>{exp.jobTitle}</h3>
                  <p className="text-sm font-light text-slate-500" style={getSmallStyle(0.875)}>{exp.startDate} - {exp.endDate}</p>
                </div>
                <p className="text-md text-slate-600 italic" style={getStyle(1)}>{exp.company}</p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  {renderDescription(exp.description)}
                </ul>
              </div>
            ))}
          </div>
        </section>
        )}
        
        {/* Projects */}
        {projects.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold border-b-2 border-slate-200 pb-2 mb-4 text-slate-700" style={getStyle(1.25)}>
            {t('previewProjects')}
          </h2>
          <div className="space-y-6">
            {projects.map(proj => (
              <div key={proj.id}>
                <div className="flex justify-between items-baseline">
                  <h3 className="text-md font-semibold text-slate-800" style={getStyle(1)}>{proj.name}</h3>
                  {proj.link && (
                    <a href={proj.link.startsWith('http') ? proj.link : `//${proj.link}`} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 hover:text-slate-800 transition-colors" style={getSmallStyle(0.875)}>
                      {t('projectLink')}
                    </a>
                  )}
                </div>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  {renderDescription(proj.description)}
                </ul>
              </div>
            ))}
          </div>
        </section>
        )}

        {/* Skills */}
        {skills && (
        <section>
            <h2 className="text-xl font-semibold border-b-2 border-slate-200 pb-2 mb-3 text-slate-700" style={getStyle(1.25)}>
                {t('previewSkills')}
            </h2>
            <div className="flex flex-wrap gap-2">
                {skills.split(',').map(skill => skill.trim()).filter(Boolean).map((skill, index) => (
                    <span key={index} className="bg-slate-100 text-slate-700 font-medium px-3 py-1 rounded-full" style={getSmallStyle(0.75)}>
                        {skill}
                    </span>
                ))}
            </div>
        </section>
        )}

        {/* Education */}
        {education.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold border-b-2 border-slate-200 pb-2 mb-4 text-slate-700" style={getStyle(1.25)}>
            {t('previewEducation')}
          </h2>
          <div className="space-y-4">
            {education.map(edu => (
              <div key={edu.id}>
                <div className="flex justify-between items-baseline">
                  <h3 className="text-md font-semibold text-slate-800" style={getStyle(1)}>{edu.degree}</h3>
                  <p className="text-sm font-light text-slate-500" style={getSmallStyle(0.875)}>{edu.startDate} - {edu.endDate}</p>
                </div>
                <p className="text-md text-slate-600 italic" style={getStyle(1)}>{edu.institution}</p>
              </div>
            ))}
          </div>
        </section>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold border-b-2 border-slate-200 pb-2 mb-4 text-slate-700" style={getStyle(1.25)}>
            {t('previewCertifications')}
          </h2>
          <div className="space-y-4">
            {certifications.map(cert => (
              <div key={cert.id}>
                <div className="flex justify-between items-baseline">
                  <h3 className="text-md font-semibold text-slate-800" style={getStyle(1)}>{cert.name}</h3>
                  <p className="text-sm font-light text-slate-500" style={getSmallStyle(0.875)}>{cert.date}</p>
                </div>
                <p className="text-md text-slate-600 italic" style={getStyle(1)}>{cert.issuer}</p>
              </div>
            ))}
          </div>
        </section>
        )}
      </div>
    </div>
  );
};

export default CVPreview;
