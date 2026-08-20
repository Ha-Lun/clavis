
import fs from 'fs';
import path from 'path';

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1]] = match[2];
    }
  });
}

const API_KEY = process.env.NVIDIA_API_KEY;

if (!API_KEY) {
  console.error("NVIDIA_API_KEY not found.");
  process.exit(1);
}

async function run() {
  const url = "https://integrate.api.nvidia.com/v1/chat/completions";
  
  const payload = {
    model: "meta/muse-glimmer-30b",
    messages: [
      { role: "user", content: "Hello, who are you?" }
    ],
    temperature: 0.2,
    top_p: 0.7,
    max_tokens: 1024,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("Response from meta/muse-glimmer-30b:");
    console.log(data.choices[0].message.content);
    console.log("\nSuccess!");
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}

run();
