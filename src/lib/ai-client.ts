import OpenAI from "openai";
import { getModelInfo } from "./models";

export function createAIClient(modelId: string) {
  const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  const modelInfo = getModelInfo(modelId);

  if (modelId.startsWith("groq/") || (!NVIDIA_API_KEY && GROQ_API_KEY)) {
    return new OpenAI({
      apiKey: GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
      timeout: 90 * 1000,
      maxRetries: 1,
    });
  }

  if (!NVIDIA_API_KEY) {
    throw new Error("NVIDIA_API_KEY is not configured in .env.local");
  }

  return new OpenAI({
    apiKey: NVIDIA_API_KEY,
    baseURL: "https://integrate.api.nvidia.com/v1",
    timeout: 90 * 1000,
    maxRetries: 1,
  });
}
