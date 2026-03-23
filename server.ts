import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // Helper to get a fresh AI instance with the current API key
  const getAI = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in environment variables.");
    }
    return new GoogleGenAI({ apiKey });
  };

  // API Routes
  app.post("/api/story/outline", async (req, res) => {
    const { theme, characterDescription, narrative, isConsistent, isStyleConsistent, pageCount } = req.body;
    
    try {
      const ai = getAI();
      const characterConsistencyInstruction = isConsistent 
        ? "The image prompts MUST include the EXACT same character description for consistency. First, define a 'masterCharacterDescription' that is extremely detailed (clothing, colors, specific features)." 
        : "The image prompts can vary the character's appearance slightly for variety.";

      const styleConsistencyInstruction = isStyleConsistent
        ? "Maintain a strictly consistent art style across all image prompts. First, define a 'masterStyleDescription' (e.g., 'Whimsical children's book illustration, soft watercolor textures, warm golden hour lighting, hand-drawn charcoal outlines')."
        : "You can experiment with slightly different artistic variations of the 'Whimsical children's book illustration' style.";

      const narrativeInstruction = narrative 
        ? `Follow this specific story narrative/plot: "${narrative}".`
        : "Create an original engaging plot based on the theme and character.";

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Create a ${pageCount}-page children's storybook outline.
        Theme: "${theme}"
        Main Character: "${characterDescription}"
        ${narrativeInstruction}
        
        For each page, provide the story text (1-2 sentences) and a detailed image prompt.
        ${characterConsistencyInstruction}
        ${styleConsistencyInstruction}
        
        CRITICAL INSTRUCTIONS FOR IMAGE PROMPTS:
        1. The 'imagePrompt' for each page MUST start with the 'masterCharacterDescription' and 'masterStyleDescription'.
        2. Each 'imagePrompt' MUST include the 'text' of the page to be rendered directly into the image.
        3. The text MUST be placed 'smartly' in the scene—typically in a clear area of negative space (like the sky, a quiet corner, or a flat surface) so it is highly readable but DOES NOT cover the characters or important story elements.
        4. Describe the font style (e.g., 'whimsical handwritten', 'elegant serif', 'bold playful block letters') that perfectly matches the theme "${theme}".`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              masterCharacterDescription: { type: Type.STRING },
              masterStyleDescription: { type: Type.STRING },
              pages: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING },
                    imagePrompt: { type: Type.STRING },
                  },
                  required: ["text", "imagePrompt"],
                },
              },
            },
            required: ["title", "masterCharacterDescription", "masterStyleDescription", "pages"],
          },
        },
      });

      res.json(JSON.parse(response.text || "{}"));
    } catch (error: any) {
      console.error("Error generating outline:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/story/describe-character", async (req, res) => {
    const { base64Image, mimeType } = req.body;
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            inlineData: {
              data: base64Image.split(',')[1],
              mimeType: mimeType,
            },
          },
          {
            text: "Describe this character in detail for a children's book illustration. Focus on physical features, clothing, and overall vibe. Keep the description concise but descriptive enough for an image generation model to recreate it consistently.",
          },
        ],
      });
      res.json({ description: response.text || "A mysterious character" });
    } catch (error: any) {
      console.error("Error describing character:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/story/describe-theme", async (req, res) => {
    const { base64Image, mimeType } = req.body;
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            inlineData: {
              data: base64Image.split(',')[1],
              mimeType: mimeType,
            },
          },
          {
            text: "Describe this setting or theme in detail for a children's book illustration. Focus on the environment, atmosphere, colors, and key visual elements. Keep the description concise but descriptive enough for an image generation model to recreate this world consistently.",
          },
        ],
      });
      res.json({ description: response.text || "A magical world" });
    } catch (error: any) {
      console.error("Error describing theme:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/story/generate-image", async (req, res) => {
    const { prompt, referenceImage } = req.body;
    try {
      const ai = getAI();
      const contents: any[] = [];
      if (referenceImage && referenceImage.data.startsWith('data:')) {
        contents.push({
          inlineData: {
            data: referenceImage.data.split(',')[1],
            mimeType: referenceImage.mimeType,
          },
        });
        contents.push({ text: `Using the character and style from this reference image, generate a new scene: ${prompt}` });
      } else {
        contents.push({ text: prompt });
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: contents,
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });

      const imagePart = response.candidates?.[0]?.content?.parts.find((p) => p.inlineData);
      if (imagePart?.inlineData) {
        res.json({ imageUrl: `data:image/png;base64,${imagePart.inlineData.data}` });
      } else {
        res.status(500).json({ error: "Failed to generate image" });
      }
    } catch (error: any) {
      console.error("Error generating image:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
