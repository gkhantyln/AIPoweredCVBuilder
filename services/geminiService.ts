
import { GoogleGenAI, Type, Chat } from "@google/genai";
import type { CVData } from '../types';

let ai: GoogleGenAI | null = null;
const model = 'gemini-2.5-flash';

export const initializeAi = (apiKey: string) => {
    try {
        if (apiKey) {
            ai = new GoogleGenAI({ apiKey });
        } else {
            ai = null;
        }
    } catch (error) {
        console.error("Failed to initialize GoogleGenAI:", error);
        ai = null;
    }
};

const cvDataSchema = {
    type: Type.OBJECT,
    properties: {
        personalInfo: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                title: { type: Type.STRING },
                email: { type: Type.STRING },
                phone: { type: Type.STRING },
                website: { type: Type.STRING, description: 'The personal website or portfolio link. Can be an empty string if not present.' },
                location: { type: Type.STRING },
            },
            required: ['name', 'title', 'email', 'phone', 'location']
        },
        summary: { type: Type.STRING },
        experience: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    jobTitle: { type: Type.STRING },
                    company: { type: Type.STRING },
                    startDate: { type: Type.STRING },
                    endDate: { type: Type.STRING },
                    description: { type: Type.STRING, description: "A single string containing responsibilities and achievements. Use newline characters (\\n) to separate bullet points or paragraphs." }
                },
                required: ['jobTitle', 'company', 'startDate', 'endDate', 'description']
            }
        },
        projects: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    link: { type: Type.STRING, description: 'A URL to the project. Can be an empty string.' },
                    description: { type: Type.STRING, description: "A single string containing the project details. Use newline characters (\\n) to separate bullet points or paragraphs." }
                },
                required: ['name', 'link', 'description']
            }
        },
        education: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    degree: { type: Type.STRING },
                    institution: { type: Type.STRING },
                    startDate: { type: Type.STRING },
                    endDate: { type: Type.STRING }
                },
                required: ['degree', 'institution', 'startDate', 'endDate']
            }
        },
        certifications: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    issuer: { type: Type.STRING },
                    date: { type: Type.STRING }
                },
                required: ['name', 'issuer', 'date']
            }
        },
        skills: { type: Type.STRING, description: "A single, comma-separated string of all skills." }
    },
    required: ['personalInfo', 'summary', 'experience', 'projects', 'education', 'certifications', 'skills']
};


export const enhanceTextWithAI = async (prompt: string, textToEnhance: string): Promise<string> => {
  if (!ai) {
    return "Error: Gemini API key not set or is invalid. Please add your key in the settings.";
  }
  if (!textToEnhance.trim()) {
    return "Error: Cannot enhance empty text.";
  }

  try {
    const fullPrompt = `${prompt}\n\nHere is the text to enhance:\n\n"""\n${textToEnhance}\n"""`;

    const response = await ai.models.generateContent({
      model,
      contents: fullPrompt,
    });
    
    const enhancedText = response.text;
    
    if (!enhancedText) {
        return "Error: AI returned an empty response.";
    }
    
    return enhancedText.trim();
  } catch (error) {
    console.error("Error enhancing text with AI:", error);
    if (error instanceof Error) {
        return `Error: ${error.message}`;
    }
    return "Error: An unknown error occurred while enhancing text.";
  }
};

export const translateTextWithAI = async (textToTranslate: string): Promise<string> => {
    if (!ai) {
        return "Error: Gemini API key not set or is invalid. Please add your key in the settings.";
    }
    if (!textToTranslate.trim()) {
        return "Error: Cannot translate empty text.";
    }

    try {
        const prompt = `Translate the following English text to Turkish:\n\n"""\n${textToTranslate}\n"""`;
        
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
        });

        const translatedText = response.text;

        if (!translatedText) {
            return "Error: AI returned an empty response during translation.";
        }

        return translatedText.trim();
    } catch (error) {
        console.error("Error translating text with AI:", error);
        if (error instanceof Error) {
            return `Error: ${error.message}`;
        }
        return "Error: An unknown error occurred while translating text.";
    }
};


export const parseCVWithAI = async (cvText: string): Promise<CVData> => {
  if (!ai) {
    throw new Error("Gemini API key not set or is invalid. Please add your key in the settings to use this feature.");
  }
  try {
    const prompt = `Parse the following resume text into a JSON object matching the provided schema. Ensure that the 'description' for work experience and projects is a single string with distinct points separated by newline characters (\\n), and that 'skills' is a single comma-separated string.
    
    Resume Text:
    """
    ${cvText}
    """`;
    
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: cvDataSchema,
        },
    });

    const jsonString = response.text.trim();
    const parsedData = JSON.parse(jsonString);

    // Add unique IDs to array items, as they are required by the form components, and add null for photo.
    const dataWithIds: CVData = {
        ...parsedData,
        personalInfo: {
            ...parsedData.personalInfo,
            website: parsedData.personalInfo.website || '',
            photo: null,
        },
        experience: parsedData.experience?.map((exp: any, index: number) => ({ ...exp, id: `exp-${Date.now()}-${index}` })) || [],
        projects: parsedData.projects?.map((proj: any, index: number) => ({ ...proj, id: `proj-${Date.now()}-${index}` })) || [],
        education: parsedData.education?.map((edu: any, index: number) => ({ ...edu, id: `edu-${Date.now()}-${index}` })) || [],
        certifications: parsedData.certifications?.map((cert: any, index: number) => ({ ...cert, id: `cert-${Date.now()}-${index}` })) || [],
    };

    return dataWithIds;
  } catch (error) {
    console.error("Error parsing CV with AI:", error);
    throw new Error("Failed to parse CV data. The AI model could not process the provided text.");
  }
};

export interface AnalysisResult {
    overallScore: number;
    strengths: string[];
    weaknesses: string[];
    sectionBasedSuggestions: {
        section: string;
        feedback: string;
    }[];
    industrySpecificRecommendations: string[];
    generalImprovementAdvice: string[];
}


const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    overallScore: { type: Type.NUMBER, description: 'A score from 0 to 100.' },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    weaknesses: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Weaknesses or missing information." },
    sectionBasedSuggestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          section: { type: Type.STRING, description: "e.g., Personal Information, Work Experience" },
          feedback: { type: Type.STRING },
        },
        required: ['section', 'feedback']
      }
    },
    industrySpecificRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
    generalImprovementAdvice: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['overallScore', 'strengths', 'weaknesses', 'sectionBasedSuggestions', 'industrySpecificRecommendations', 'generalImprovementAdvice']
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const analyzeCVWithAI = async (
    cvJsonString: string,
    analysisLanguage: 'en' | 'tr',
    onProgress: (message: string) => void
): Promise<AnalysisResult> => {
    if (!ai) {
        throw new Error("Gemini API key not set or is invalid. Please add your key in the settings to use this feature.");
    }

    const outputLanguage = analysisLanguage === 'tr' ? 'Turkish' : 'English';
    const systemInstruction = `You are an advanced CV/Resume evaluation expert for the Turkish job market. I will send you a single, large JSON document containing a user's CV data. However, this JSON document will be broken into multiple text parts because of size limitations.

Your task is to:
1.  Receive each part I send you.
2.  Acknowledge each part with a simple "OK."
3.  Internally, you must concatenate these text parts in the order you receive them to reconstruct the original, complete JSON string.
4.  Do NOT attempt to analyze or parse any individual part. Wait until I give the final command.
5.  After I send the message "I have now provided all parts of the CV JSON.", you will then parse the complete, reassembled JSON string.
6.  Finally, perform a comprehensive evaluation based on the full CV data and respond ONLY with a single JSON object matching the provided schema. Your evaluation should be practical, concise, and actionable, considering ATS optimization and Turkish hiring practices.
7.  IMPORTANT: The final JSON response containing the analysis MUST be written entirely in ${outputLanguage}. All strings within the JSON object (strengths, weaknesses, feedback, etc.) must be in ${outputLanguage}.`;
    
    const chat: Chat = ai.chats.create({
      model,
      config: { systemInstruction },
    });

    try {
        const chunkSize = 10000; // Split the raw string into 10k character chunks
        const numChunks = Math.ceil(cvJsonString.length / chunkSize);

        for (let i = 0; i < numChunks; i++) {
            const chunk = cvJsonString.substring(i * chunkSize, (i + 1) * chunkSize);
            onProgress(`Sending CV data (Part ${i + 1}/${numChunks})...`);
            await chat.sendMessage({ message: `Here is part ${i + 1}/${numChunks} of the CV JSON document:\n\n${chunk}` });
            await wait(300); // Small delay to prevent rate limiting
        }

        onProgress('Finalizing analysis...');
        const finalPrompt = `I have now provided all parts of the CV JSON. Please reassemble them, parse the complete JSON, and provide the full, final analysis in the specified JSON format. Your response must be only the JSON object, with no other text before or after it. Remember, all text in the final analysis must be in ${outputLanguage}.`;

        const finalResponse = await chat.sendMessage({ 
            message: finalPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: analysisSchema,
            },
        });

        const jsonString = finalResponse.text.trim();
        return JSON.parse(jsonString);

    } catch (error: any) {
        console.error("Error analyzing CV with AI:", error);
        if (error.message && (error.message.includes('token') || (error.toString && error.toString().includes('token')))) {
            throw new Error(`Analysis failed because the CV is too large, even for the chunking method. Please try with a more concise CV. (Details: ${error.message})`);
        }
        throw new Error(`Failed to analyze CV. The AI model could not process the provided data. (Details: ${error.message})`);
    }
};
