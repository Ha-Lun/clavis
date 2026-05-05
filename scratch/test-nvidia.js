const OpenAI = require('openai');

async function testNvidia() {
  console.log("Key:", process.env.NVIDIA_API_KEY ? "Present" : "Missing");
  const openai = new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: "https://integrate.api.nvidia.com/v1",
  });

  try {
    console.log("Starting stream...");
    const stream = await openai.chat.completions.create({
      model: "deepseek-ai/deepseek-v4-flash",
      messages: [{ role: "user", content: "Hello, say hi!" }],
      stream: true,
    });

    for await (const chunk of stream) {
      process.stdout.write(chunk.choices[0]?.delta?.content || "");
    }
    console.log("\nDone.");
  } catch (err) {
    console.error("Error:", err);
  }
}

testNvidia();
