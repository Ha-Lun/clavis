import OpenAI from "openai";

const API_KEY = process.env.NVIDIA_API_KEY;

export function createNvidiaClient() {
  if (!API_KEY) {
    throw new Error("NVIDIA_API_KEY is not configured in .env.local");
  }
  
  return new OpenAI({
    apiKey: API_KEY,
    baseURL: "https://integrate.api.nvidia.com/v1",
    timeout: 90 * 1000,
    maxRetries: 1,
  });
}