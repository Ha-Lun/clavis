const OpenAI = require("openai");

const API_KEY = process.env.NVIDIA_API_KEY;

if (!API_KEY) {
  console.error("Error: NVIDIA_API_KEY is not set in environment variables");
  console.error("Set NVIDIA_API_KEY in .env.local before running this script");
  process.exit(1);
}

const client = new OpenAI({
  apiKey: API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1"
});

async function main() {
  console.log("Using API Key:", API_KEY.substring(0, 10) + "...");
  try {
    console.log("Fetching model list from integrate.api.nvidia.com...");
    const list = await client.models.list();
    const modelIds = list.data.map(m => m.id);
    const modelIdsSet = new Set(modelIds);
    console.log(`\nFound ${modelIds.length} models. Here are some of them:`);
    console.log(modelIds.slice(0, 30));

    const testModels = [
      "nvidia/nemotron-3-nano-30b-a3b",
      "moonshotai/kimi-k2.6",
      "minimaxai/minimax-m2.7",
      "qwen/qwen3.5-122b-a10b",
      "deepseek-ai/deepseek-v4-pro",
      "mistralai/mistral-small-4-119b-2603"
    ];

    console.log("\nTesting configured models responsiveness...");
    for (const model of testModels) {
      const isAvailable = modelIdsSet.has(model);
      console.log(`\n--- Model: ${model} (In Catalog: ${isAvailable ? "YES" : "NO"}) ---`);
      if (!isAvailable) {
        // Try finding a matching one
        const matches = modelIds.filter(id => id.toLowerCase().includes(model.split('/')[1]?.split('-')[0] || ""));
        if (matches.length > 0) {
          console.log(`Suggested alternatives found in list:`, matches.slice(0, 5));
        }
        continue;
      }

      const start = Date.now();
      try {
        console.log(`Sending quick test request to ${model}...`);
        const res = await Promise.race([
          client.chat.completions.create({
            model: model,
            messages: [{ role: "user", content: "Say hi in exactly one word." }],
            max_tokens: 5,
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout (10s)")), 10000))
        ]);
        console.log(`✅ Success in ${Date.now() - start}ms! Response: "${res.choices[0]?.message?.content?.trim()}"`);
      } catch (err) {
        console.log(`❌ Failed or timed out in ${Date.now() - start}ms. Error:`, err.message);
      }
    }
  } catch (err) {
    console.error("General error listing or testing models:", err);
  }
}

main();
