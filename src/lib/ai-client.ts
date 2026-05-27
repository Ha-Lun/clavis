import OpenAI from "openai";
import { getModelInfo } from "./models";

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || "REVOKED_NVIDIA_API_KEY";
const GOOGLE_API_KEY = process.env.GOOGLE_AI_STUDIO_API_KEY || process.env.GEMINI_API_KEY || "AIzaSyANr6ZYCZAe7ZrquDwLxsXhJm4a1Aa-UFw";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "sk-or-v1-placeholder-key-replace-me";

export function createAIClient(modelId: string) {
  const modelInfo = getModelInfo(modelId);

  // Route premium models through OpenRouter
  if (modelInfo?.isPremium) {
    return new OpenAI({
      apiKey: OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://clavis.example.com",
        "X-Title": "Clavis Dark Luxury AI",
      },
      timeout: 90 * 1000,
      maxRetries: 1,
    });
  }

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
