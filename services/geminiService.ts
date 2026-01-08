
import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = 'gemini-2.5-flash-image';

export async function generateMockup(logoBase64: string, logoMimeType: string, product: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const prompt = `Create a professional, high-resolution commercial product mockup for a ${product}. 
  The provided image is a logo. Place this logo naturally and realistically onto the ${product}. 
  The background should be a clean, minimalist studio setting with soft lighting. 
  Ensure the logo follows the contours and texture of the material perfectly.`;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: {
      parts: [
        {
          inlineData: {
            data: logoBase64.split(',')[1],
            mimeType: logoMimeType,
          },
        },
        { text: prompt },
      ],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("Failed to generate image from Gemini API");
}

export async function editMockup(currentImageBase64: string, editPrompt: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: {
      parts: [
        {
          inlineData: {
            data: currentImageBase64.split(',')[1],
            mimeType: 'image/png',
          },
        },
        { text: editPrompt },
      ],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("Failed to edit image from Gemini API");
}
