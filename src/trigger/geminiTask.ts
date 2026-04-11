import { task } from "@trigger.dev/sdk/v3";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Interface for type safety
interface GeminiPayload {
  systemPrompt?: string;
  userMessage: string;
  nodeId: string;
  media?: {
    inlineData: {
      data: string; // Base64 encoded string
      mimeType: string;
    };
  } | null;
}

export const geminiTask = task({
  id: "gemini-llm",
  run: async (payload: GeminiPayload) => {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) throw new Error("CRITICAL: API Key missing in environment.");

    const { userMessage, systemPrompt, nodeId, media } = payload;
    const genAI = new GoogleGenerativeAI(apiKey);

    try {
      console.log(`📡 Node [${nodeId}]: Executing via Gemini 3 Flash...`);

      // Using the 2026 model ID
      const model = genAI.getGenerativeModel({ 
        model: "gemini-3-flash-preview", 
      });

      // Multimodal logic: Parts array mein system prompt, image/video (agar ho), aur user message daalna
      const promptParts: any[] = [];

      // 1. Add System Instructions if present
      if (systemPrompt) {
        promptParts.push({ text: `Instructions: ${systemPrompt}` });
      }

      // 2. Add Media (Image/Video) if provided
      if (media && media.inlineData) {
        promptParts.push({
          inlineData: {
            data: media.inlineData.data,
            mimeType: media.inlineData.mimeType
          }
        });
      }

      // 3. Add User Query
      promptParts.push({ text: `Query: ${userMessage}` });

      // Generate content using the parts array
      const result = await model.generateContent(promptParts);
      const response = await result.response;
      const text = response.text();

      if (!text) throw new Error("Gemini 3 returned empty response.");

      return { 
        text,
        nodeId 
      };
    } catch (error: any) {
      console.error("Gemini 3 Execution Error:", error);
      
      if (error.message.includes("404")) {
         throw new Error("MODEL_MISMATCH: Ensure your AI Studio project has Gemini 3 access enabled.");
      }
      throw error;
    }
  },
});
