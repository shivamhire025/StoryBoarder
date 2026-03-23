import { GoogleGenAI, Type } from "@google/genai";
import { StoryOutline } from "../types";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateStoryOutline = async (
  theme: string,
  characterDescription: string,
  narrative: string = "",
  isConsistent: boolean = true,
  isStyleConsistent: boolean = true,
  pageCount: number = 6,
  userTitle?: string,
  retries = 3
): Promise<StoryOutline> => {
  const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey: apiKey! });
  
  const titleInstruction = userTitle 
    ? `The title of the book MUST be EXACTLY: "${userTitle}".`
    : "Create a catchy and whimsical title for the story.";

  const characterConsistencyInstruction = isConsistent 
    ? "The image prompts MUST include the EXACT same character description for consistency. First, define a 'masterCharacterDescription' that is extremely detailed (clothing, colors, specific features)." 
    : "The image prompts can vary the character's appearance slightly for variety.";

  const styleConsistencyInstruction = isStyleConsistent
    ? "Maintain a strictly consistent art style across all image prompts. First, define a 'masterStyleDescription' (e.g., 'Whimsical children's book illustration, soft watercolor textures, warm golden hour lighting, hand-drawn charcoal outlines')."
    : "You can experiment with slightly different artistic variations of the 'Whimsical children's book illustration' style.";

  const narrativeInstruction = narrative 
    ? `Follow this specific story narrative/plot: "${narrative}".`
    : "Create an original engaging plot based on the theme and character.";

  for (let i = 0; i < retries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Create a children's storybook outline with EXACTLY ${pageCount} pages.
        ${titleInstruction}
        Theme: "${theme}"
        Main Character: "${characterDescription}"
        ${narrativeInstruction}
        
        For each page, provide the story text (1-2 sentences) and a detailed image prompt.
        The 'pages' array in your JSON response MUST contain EXACTLY ${pageCount} items.
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
              masterCharacterDescription: { type: Type.STRING, description: "Detailed physical description of the character to be used in every prompt." },
              masterStyleDescription: { type: Type.STRING, description: "Detailed description of the art style to be used in every prompt." },
              pages: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING },
                    imagePrompt: { type: Type.STRING, description: "Detailed prompt for this specific page, incorporating the master descriptions and instructions for text placement and font style." },
                  },
                  required: ["text", "imagePrompt"],
                },
              },
            },
            required: ["title", "masterCharacterDescription", "masterStyleDescription", "pages"],
          },
        },
      });

      return JSON.parse(response.text || "{}") as StoryOutline;
    } catch (error: any) {
      const errorMessage = error?.message || "";
      const errorStatus = error?.status || "";
      const isRateLimit = errorMessage.includes('429') || 
                          errorMessage.includes('RESOURCE_EXHAUSTED') || 
                          errorStatus === 'RESOURCE_EXHAUSTED' ||
                          error?.error?.status === 'RESOURCE_EXHAUSTED';
      
      if (isRateLimit && i < retries - 1) {
        const waitTime = Math.pow(2, i) * 2000 + Math.random() * 1000;
        console.warn(`Rate limit hit on outline generation, retrying in ${Math.round(waitTime)}ms... (Attempt ${i + 1}/${retries})`);
        await sleep(waitTime);
        continue;
      }
      throw error;
    }
  }
  return { title: "", masterCharacterDescription: "", masterStyleDescription: "", pages: [] };
};

export const describeCharacterFromImage = async (base64Image: string, mimeType: string, retries = 3): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey: apiKey! });
  
  for (let i = 0; i < retries; i++) {
    try {
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

      return response.text || "A mysterious character";
    } catch (error: any) {
      const errorMessage = error?.message || "";
      const errorStatus = error?.status || "";
      const isRateLimit = errorMessage.includes('429') || 
                          errorMessage.includes('RESOURCE_EXHAUSTED') || 
                          errorStatus === 'RESOURCE_EXHAUSTED' ||
                          error?.error?.status === 'RESOURCE_EXHAUSTED';
      
      if (isRateLimit && i < retries - 1) {
        const waitTime = Math.pow(2, i) * 2000 + Math.random() * 1000;
        console.warn(`Rate limit hit on character description, retrying in ${Math.round(waitTime)}ms... (Attempt ${i + 1}/${retries})`);
        await sleep(waitTime);
        continue;
      }
      throw error;
    }
  }
  return "A mysterious character";
};

export const describeThemeFromImage = async (base64Image: string, mimeType: string, retries = 3): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey: apiKey! });
  
  for (let i = 0; i < retries; i++) {
    try {
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

      return response.text || "A magical world";
    } catch (error: any) {
      const errorMessage = error?.message || "";
      const errorStatus = error?.status || "";
      const isRateLimit = errorMessage.includes('429') || 
                          errorMessage.includes('RESOURCE_EXHAUSTED') || 
                          errorStatus === 'RESOURCE_EXHAUSTED' ||
                          error?.error?.status === 'RESOURCE_EXHAUSTED';
      
      if (isRateLimit && i < retries - 1) {
        const waitTime = Math.pow(2, i) * 2000 + Math.random() * 1000;
        console.warn(`Rate limit hit on theme description, retrying in ${Math.round(waitTime)}ms... (Attempt ${i + 1}/${retries})`);
        await sleep(waitTime);
        continue;
      }
      throw error;
    }
  }
  return "A magical world";
};

export const generatePageImage = async (
  prompt: string, 
  referenceImage?: { data: string; mimeType: string }, 
  retries = 2
): Promise<string | undefined> => {
  const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey: apiKey! });
  
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

  for (let i = 0; i < retries; i++) {
    try {
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
        return `data:image/png;base64,${imagePart.inlineData.data}`;
      }
      return undefined;
    } catch (error: any) {
      const errorMessage = error?.message || "";
      const errorStatus = error?.status || "";
      const isRateLimit = errorMessage.includes('429') || 
                          errorMessage.includes('RESOURCE_EXHAUSTED') || 
                          errorStatus === 'RESOURCE_EXHAUSTED' ||
                          error?.error?.status === 'RESOURCE_EXHAUSTED';
      
      if (isRateLimit && i < retries - 1) {
        // Try to extract retryDelay from the error details if available
        let waitTime = Math.pow(2, i) * 5000 + Math.random() * 1000;
        
        try {
          const details = error?.error?.details || [];
          const retryInfo = details.find((d: any) => d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo');
          if (retryInfo?.retryDelay) {
            const seconds = parseInt(retryInfo.retryDelay.replace('s', ''));
            if (!isNaN(seconds)) {
              waitTime = (seconds + 1) * 1000; // Add 1s buffer
            }
          }
        } catch (e) {
          // Fallback to exponential backoff
        }

        console.warn(`Rate limit hit, retrying in ${Math.round(waitTime)}ms... (Attempt ${i + 1}/${retries})`);
        await sleep(waitTime);
        continue;
      }

      // If it's a 'limit: 0' or quota error, provide a more helpful message
      if (errorMessage.includes('limit: 0') || errorMessage.includes('quota') || errorStatus === 'RESOURCE_EXHAUSTED') {
        throw new Error("API Quota or Rate Limit reached. If you are on a paid plan, this is likely a temporary 'Requests Per Minute' limit. Please wait a moment and use the 'Retry' button on individual pages to space out the requests.");
      }
      
      throw error;
    }
  }
  return undefined;
};
