import { performWebSearch } from "./src/lib/search";

async function main() {
  try {
    const SCRAPER_API_URL = "https://scraper.lundstromslogiska.se/api/v1/scrape";
    const SCRAPER_API_KEY = "sdgfyuasdf24b35784tbiske832bskdfba76f82q435ukerfb8sdftya873bfi3475623485gbwsidbf8sd7f873245e";
    const query = "wikipedia typescript";
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SCRAPER_API_KEY}`,
    };

    // Step 1: Search via DDG
    const searchPayload = {
      url: `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
      scraper_type: "static",
      selectors: {
        urls: ".result__url@href",
      },
    };

    const searchRes = await fetch(SCRAPER_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(searchPayload),
    });

    const searchData = await searchRes.json();
    console.log("URLs:", searchData.result?.urls);
    
  } catch (error) {
    console.error("Error occurred:", error);
  }
}

main();
