import { performWebSearch } from './src/lib/search';

const SCRAPER_API_URL = "https://scraper.lundstromslogiska.se/api/v1/scrape";
const SCRAPER_API_KEY = "sdgfyuasdf24b35784tbiske832bskdfba76f82q435ukerfb8sdftya873bfi3475623485gbwsidbf8sd7f873245e";

async function run() {
  const url = "https://techcrunch.com/category/artificial-intelligence/";
  const payload = {
    url,
    scraper_type: "static",
    selectors: {
      title: "title",
      content: "body",
    },
  };

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${SCRAPER_API_KEY}`,
  };

  const res = await fetch(SCRAPER_API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
run().catch(console.error);
