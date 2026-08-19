const SCRAPER_API_URL = "http://100.126.82.90:8731/api/v1/scrape";
const SCRAPER_API_KEY = "sdgfyuasdf24b35784tbiske832bskdfba76f82q435ukerfb8sdftya873bfi3475623485gbwsidbf8sd7f873245e";

export interface SearchResult {
  url: string;
  title: string;
  content: string;
}

export async function performWebSearch(query: string): Promise<SearchResult[]> {
  try {
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

    if (!searchRes.ok) {
      throw new Error(`Search DDG failed with status ${searchRes.status}`);
    }

    const searchData = await searchRes.json();
    if (searchData.error) {
      throw new Error(`Scraper API error: ${searchData.error}`);
    }

    const urls: string[] = searchData.result?.urls || [];
    const topUrls = urls.slice(0, 3);

    // Step 2: Concurrently scrape URLs
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

      return {
        url,
        title: data.result?.title?.[0] || "",
        content: data.result?.content?.[0] || "",
      };
    });

    const results = await Promise.allSettled(scrapePromises);
    
    return results
      .filter((r): r is PromiseFulfilledResult<SearchResult> => r.status === "fulfilled")
      .map(r => r.value);
  } catch (error) {
    console.error("[Search] Web search failed:", error);
    return [];
  }
}
