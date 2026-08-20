import fetch from "node-fetch";

const SCRAPER_API_URL = "https://scraper.lundstromslogiska.se/api/v1/scrape";
const SCRAPER_API_KEY = "sdgfyuasdf24b35784tbiske832bskdfba76f82q435ukerfb8sdftya873bfi3475623485gbwsidbf8sd7f873245e";

async function run() {
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${SCRAPER_API_KEY}`,
  };

  const query = "test";
  const searchPayload = {
    url: `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
    scraper_type: "static",
    selectors: {
      urls: ".result__url@href",
    },
  };

  console.log("Sending request to:", SCRAPER_API_URL);
  
  try {
    // using native fetch
    const searchRes = await fetch(SCRAPER_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(searchPayload),
    });
    
    console.log("Status:", searchRes.status);
    const text = await searchRes.text();
    console.log("Response:", text);
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

run();
