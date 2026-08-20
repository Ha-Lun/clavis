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
    const rawUrls: string[] = searchData.result?.urls || [];
    const urls = rawUrls.map(u => {
      if (u.includes('duckduckgo.com/l/?uddg=')) {
        try {
          const urlObj = new URL(u.startsWith('//') ? `https:${u}` : u);
          const uddg = urlObj.searchParams.get('uddg');
          if (uddg) return decodeURIComponent(uddg);
        } catch (e) {}
      }
      return u;
    });

    const topUrls = urls.slice(0, 3);
    console.log("Top URLs:", topUrls);

    const scrapePromises = topUrls.map(async (url) => {
      const payload = {
        url,
        scraper_type: "dynamic",
        selectors: {
          title: "title",
          content: "body",
        },
      };

      const res = await fetch(SCRAPER_API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Scraping ${url} failed with status ${res.status}`);
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(`Scraping API error for ${url}: ${data.error}`);
      }

      const title = data.result?.title?.[0] || "";
      const content = data.result?.content?.[0] || "";
      return `Source: ${url}\nTitle: ${title}\nContent: ${content}`;
    });

    const results = await Promise.allSettled(scrapePromises);
    
    console.log("Rejected:", results.filter(r => r.status === "rejected"));
    
  } catch (error) {
    console.error("Error occurred:", error);
  }
}

main();
