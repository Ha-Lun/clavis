import { Client, Databases } from "node-appwrite";
import * as fs from "fs";
import * as path from "path";

async function fixSchema() {
  console.log("🚀 Starting Files collection schema fix...");

  // Load env vars from .env.local
  try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line: string) => {
      const [key, ...valueParts] = line.split("=");
      const value = valueParts.join("=").trim();
      if (key && value) {
        process.env[key.trim()] = value;
      }
    });
  } catch {
    console.warn("⚠️ .env.local not found");
  }

  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

  if (!endpoint || !projectId || !apiKey || !dbId) {
    console.error("❌ Missing required environment variables.");
    console.error("   Make sure APPWRITE_API_KEY is set in .env.local");
    process.exit(1);
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  const databases = new Databases(client);
  const collectionId = "files";

  try {
    console.log(`Checking 'chat_id' attribute in collection: ${collectionId} in database: ${dbId}`);
    
    // In Appwrite, you can't easily change "required" to "optional" for an existing attribute.
    // The safest way is to delete it and recreate it as optional.
    
    try {
      console.log("Deleting 'chat_id' attribute...");
      await databases.deleteAttribute(dbId, collectionId, "chat_id");
      console.log("Waiting for deletion to propagate (this can take a moment)...");
      // Wait for it to actually be gone
      let deleted = false;
      for (let i = 0; i < 10; i++) {
        try {
          await databases.getAttribute(dbId, collectionId, "chat_id");
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (err: any) {
          if (err.code === 404) {
            deleted = true;
            break;
          }
        }
      }
      if (!deleted) throw new Error("Timed out waiting for attribute deletion");
    } catch (err: any) {
      if (err.code === 404) {
        console.log("Attribute 'chat_id' not found, proceeding to create.");
      } else {
        throw err;
      }
    }

    console.log("Re-creating 'chat_id' attribute as OPTIONAL...");
    await databases.createStringAttribute(
      dbId,
      collectionId,
      "chat_id",
      36,
      false // required = false
    );
    
    console.log("✅ Successfully fixed 'chat_id' attribute!");
    console.log("Waiting for creation to propagate...");
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log("\n✨ Done! You should be able to upload files now.");
  } catch (err: any) {
    console.error("\n❌ Fix failed:");
    console.error(err);
    process.exit(1);
  }
}

fixSchema();
