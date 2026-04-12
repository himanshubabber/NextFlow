import { task } from "@trigger.dev/sdk/v3";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Interface for type safety - Preserved original structure
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
    // 🚀 API Key validation
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) throw new Error("CRITICAL: API Key missing in environment.");

    const { userMessage, systemPrompt, nodeId, media } = payload;
    const genAI = new GoogleGenerativeAI(apiKey);

    try {
      console.log(`📡 Node [${nodeId}]: Executing via Gemini 3 Flash...`);

      // Using the latest Gemini 3 Flash model for high-fidelity vision
      const model = genAI.getGenerativeModel({ 
        model: "gemini-3-flash-preview", 
      });

      // Multimodal logic: Combining instructions, media, and query
      const promptParts: any[] = [];

      // 1. Add System Instructions (if provided by UI)
      if (systemPrompt) {
        promptParts.push({ text: `Instructions: ${systemPrompt}` });
      }

      // 2. Add Media (Image/Video Frame) logic
      if (media && media.inlineData) {
        // Validation for empty buffers
        if (media.inlineData.data) {
          promptParts.push({
            inlineData: {
              data: media.inlineData.data,
              mimeType: media.inlineData.mimeType || "image/jpeg"
            }
          });
          
          // 🚀 GALAXY AI ENHANCEMENT: Context injection for video nodes
          if (nodeId.toLowerCase().includes("video")) {
            promptParts.push({ text: "Note: The attached media is a high-resolution keyframe extracted from a video recording for spatial analysis." });
          }
        }
      }

      // 3. Add User Message (The Query)
      promptParts.push({ text: `Query: ${userMessage}` });

      // Generate content using the multimodal parts array
      const result = await model.generateContent(promptParts);
      const response = await result.response;
      const text = response.text();

      if (!text) throw new Error("Gemini 3 returned an empty response.");

      console.log(`✅ Node [${nodeId}]: Analysis successful.`);

      return { 
        text,
        nodeId 
      };
    } catch (error: any) {
      console.error("Gemini 3 Execution Error:", error);
      
      // Error handling for common AI Studio/Quota issues
      if (error.message.includes("404")) {
         throw new Error("MODEL_MISMATCH: Verify Gemini 3 Flash access in AI Studio.");
      }
      if (error.message.includes("safety")) {
         throw new Error("SAFETY_BLOCK: The model flagged the content.");
      }
      
      throw error;
    }
  },
});
