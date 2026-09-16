import OpenAI from "openai";

export function createAIClient(modelId: string) {
  const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  const GOOGLE_API_KEY = process.env.GOOGLE_AI_STUDIO_API_KEY || process.env.GEMINI_API_KEY;

  if (modelId.startsWith("google/") || (!NVIDIA_API_KEY && !GROQ_API_KEY && GOOGLE_API_KEY)) {
    if (!GOOGLE_API_KEY) throw new Error("API key is not configured for this provider");
    return new OpenAI({
      apiKey: GOOGLE_API_KEY,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      timeout: 90 * 1000,
      maxRetries: 1,
    });
  }

  if (modelId.startsWith("groq/") || modelId.startsWith("openai/gpt-oss") || modelId.startsWith("qwen/") || modelId.startsWith("allam-") || modelId.startsWith("llama-") || (!NVIDIA_API_KEY && GROQ_API_KEY)) {
    if (!GROQ_API_KEY) throw new Error("API key is not configured for this provider");
    return new OpenAI({
      apiKey: GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
      timeout: 90 * 1000,
      maxRetries: 1,
    });
  }

  if (!NVIDIA_API_KEY) {
    throw new Error("API key is not configured for this provider");
  }

  return new OpenAI({
    apiKey: NVIDIA_API_KEY,
    baseURL: "https://integrate.api.nvidia.com/v1",
    timeout: 90 * 1000,
    maxRetries: 1,
  });
}
