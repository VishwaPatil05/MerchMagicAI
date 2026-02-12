
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 8080;
const MODEL_NAME = 'gemini-2.5-flash-image';

app.post('/edit', async (req, res) => {
  try {
    const { currentImageBase64, editPrompt } = req.body;

    if (!process.env.API_KEY) {
      throw new Error('API_KEY environment variable is not set');
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
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
    console.error('Editing Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Editing service listening on port ${PORT}`);
});
