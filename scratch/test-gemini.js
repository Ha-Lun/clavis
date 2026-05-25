const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

// Manually parse .env.local
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value;
  }
});

const API_KEY = env.GOOGLE_AI_STUDIO_API_KEY || env.GEMINI_API_KEY || "";
console.log("Key:", API_KEY ? "Present (ends with " + API_KEY.slice(-5) + ")" : "Missing");

async function testGemini() {
  const openai = new OpenAI({
    apiKey: API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  });

  try {
    console.log("Starting stream...");
    const stream = await openai.chat.completions.create({
      model: "gemini-3.5-flash",
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

testGemini();
