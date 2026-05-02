import OpenAI from "openai";

export function createNvidiaClient() {
  return new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: "https://integrate.api.nvidia.com/v1",
    timeout: 90 * 1000, // 90 seconds
    maxRetries: 1,
  });
}
