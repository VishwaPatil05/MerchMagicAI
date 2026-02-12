
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
// Increase limit for base64 images
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 8080;
const MODEL_NAME = 'gemini-2.5-flash-image';

app.post('/generate', async (req, res) => {
  try {
    const { logoBase64, logoMimeType, product } = req.body;

    if (!process.env.API_KEY) {
      throw new Error('API_KEY environment variable is not set');
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
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

    let image = null;
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        image = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!image) {
      throw new Error("No image generated in response");
    }

    res.json({ image });

  } catch (error: any) {
    console.error('Generation Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Generation service listening on port ${PORT}`);
});
