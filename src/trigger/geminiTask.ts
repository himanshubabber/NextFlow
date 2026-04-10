import { task } from "@trigger.dev/sdk/v3";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const geminiTask = task({
  id: "gemini-llm",
  run: async (payload: { systemPrompt?: string; userMessage: string; nodeId: string }) => {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) throw new Error("CRITICAL: API Key missing in environment.");

    const { userMessage, systemPrompt, nodeId } = payload;
    
    // Initialize with the latest SDK version logic
    const genAI = new GoogleGenerativeAI(apiKey);

    try {
      console.log(`📡 Node [${nodeId}]: Executing via Gemini 3 Flash...`);

      // Using the specific 2026 model ID
      const model = genAI.getGenerativeModel({ 
        model: "gemini-3-flash-preview", 
      });

      const prompt = systemPrompt 
        ? `Instructions: ${systemPrompt}\n\nQuery: ${userMessage}`
        : userMessage;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text) throw new Error("Gemini 3 returned empty response.");

      return { 
        text,
        nodeId 
      };
    } catch (error: any) {
      console.error("Gemini 3 Execution Error:", error);
      
      // Fallback: Agar preview model temporarily unavailable ho
      if (error.message.includes("404")) {
         throw new Error("MODEL_MISMATCH: Ensure your AI Studio project has Gemini 3 access enabled.");
      }
      throw error;
    }
  },
});
