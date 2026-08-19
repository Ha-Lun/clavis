import { performWebSearch } from './src/lib/search';

async function run() {
  const result = await performWebSearch("latest AI news");
  console.log("FINAL RESULT:", result);
}
run().catch(console.error);
