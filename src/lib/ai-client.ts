import OpenAI from "openai";

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || "REVOKED_NVIDIA_API_KEY";
const GOOGLE_API_KEY = process.env.GOOGLE_AI_STUDIO_API_KEY || process.env.GEMINI_API_KEY || "";

export function createAIClient(modelId: string) {
  if (modelId.startsWith("google/")) {
    if (!GOOGLE_API_KEY) {
      throw new Error("GOOGLE_AI_STUDIO_API_KEY or GEMINI_API_KEY is not configured in .env.local");
    }
    return new OpenAI({
      apiKey: GOOGLE_API_KEY,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    });
  }

  // Default to NVIDIA for all other models (Mistral, Qwen, Kimi, MiniMax, Nemotron)
  return new OpenAI({
    apiKey: NVIDIA_API_KEY,
    baseURL: "https://integrate.api.nvidia.com/v1",
    timeout: 90 * 1000,
    maxRetries: 1,
  });
}
