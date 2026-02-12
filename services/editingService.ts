
import { GoogleGenAI } from "@google/genai";

// --- CONFIGURATION ---
// Set this to true to use your deployed Cloud Run backend.
// Set this to false to use the client-side Gemini SDK (Preview Mode).
const USE_CLOUD_RUN_BACKEND = false;

// Replace with your actual Cloud Run URL after deployment
const CLOUD_RUN_URL = 'https://editing-service-xyz.a.run.app/edit';

const MODEL_NAME = 'gemini-2.5-flash-image';

export async function editMockup(currentImageBase64: string, editPrompt: string): Promise<string> {
  
  // 1. Production Mode: Call Cloud Run Service
  if (USE_CLOUD_RUN_BACKEND) {
    const response = await fetch(CLOUD_RUN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentImageBase64,
        editPrompt
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to edit mockup via backend');
    }

    const data = await response.json();
    return data.image;
  }

  // 2. Preview Mode: Direct Client-Side Call
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
