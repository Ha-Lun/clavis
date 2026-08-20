import { performWebSearch } from "./src/lib/search";

async function main() {
  try {
    const result = await performWebSearch("latest AI news");
    console.log("Result length:", result.length);
    console.log("Result content:", result);
  } catch (error) {
    console.error("performWebSearch threw an error:", error);
  }
}

main();
