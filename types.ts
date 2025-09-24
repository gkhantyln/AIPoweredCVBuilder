export interface PersonalInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
  website: string;
  location: string;
  photo?: string | null;
}

export interface Experience {
  id: string;
  jobTitle: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  startDate: string;
  endDate: string;
}

export interface Project {
  id: string;
  name: string;
  link: string;
  description: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
}

export interface CVData {
  personalInfo: PersonalInfo;
  summary: string;
  experience: Experience[];
  projects: Project[];
  education: Education[];
  certifications: Certification[];
  skills: string;
}