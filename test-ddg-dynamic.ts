import { performWebSearch } from "./src/lib/search";

async function main() {
  try {
    const SCRAPER_API_URL = "https://scraper.lundstromslogiska.se/api/v1/scrape";
    const SCRAPER_API_KEY = "sdgfyuasdf24b35784tbiske832bskdfba76f82q435ukerfb8sdftya873bfi3475623485gbwsidbf8sd7f873245e";
    const query = "latest AI news";
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SCRAPER_API_KEY}`,
    };

    const searchPayload = {
      url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
      scraper_type: "dynamic",
      selectors: {
        urls: "a[data-testid='result-title-a']@href",
      },
    };

    const searchRes = await fetch(SCRAPER_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(searchPayload),
    });

    const searchData = await searchRes.json();
    console.log("Data:", searchData);
    
  } catch (error) {
    console.error("Error occurred:", error);
  }
}

main();
