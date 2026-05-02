/**
 * Appwrite Setup Script for Flux
 *
 * Run this once to create the collections, attributes, indexes,
 * and storage bucket in your existing Appwrite database.
 *
 * Usage:
 *   npx tsx scripts/setup-appwrite.ts
 *
 * Required env vars (set in .env.local or export them):
 *   NEXT_PUBLIC_APPWRITE_ENDPOINT
 *   NEXT_PUBLIC_APPWRITE_PROJECT_ID
 *   APPWRITE_API_KEY
 */

import {
  Client,
  Databases,
  Storage,
  Permission,
  Role,
  ID,
  IndexType,
} from "node-appwrite";

// Use the existing Appwrite database — do NOT try to create it
const DATABASE_ID = "69f62a8001dafec8332";
const BUCKET_ID = "flux-uploads";

async function main() {
  // Load env vars from .env.local if available
  try {
    const fs = await import("fs");
    const envContent = fs.readFileSync(".env.local", "utf-8");
    envContent.split("\n").forEach((line) => {
      const [key, ...valueParts] = line.split("=");
      const value = valueParts.join("=").trim();
      if (key && value) {
        process.env[key.trim()] = value;
      }
    });
  } catch {
    // .env.local not found, assume env vars are set
  }

  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;

  if (!endpoint || !projectId || !apiKey) {
    console.error("❌ Missing required environment variables.");
    console.error("   Set NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID, APPWRITE_API_KEY");
    process.exit(1);
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  const databases = new Databases(client);
  const storage = new Storage(client);

  console.log("🚀 Setting up Appwrite for Flux...");
  console.log(`   Using existing database: ${DATABASE_ID}\n`);

  // ── Helper to create a collection ─────────────────────────
  async function createCollection(collectionId: string, name: string) {
    try {
      await databases.createCollection(
        DATABASE_ID,
        collectionId,
        name,
        [
          Permission.read(Role.users()),
          Permission.create(Role.users()),
          Permission.update(Role.users()),
          Permission.delete(Role.users()),
        ]
      );
      console.log(`✅ Collection '${name}' created`);
    } catch (err: unknown) {
      const error = err as { code?: number };
      if (error.code === 409) {
        console.log(`⏭️  Collection '${name}' already exists`);
      } else {
        throw err;
      }
    }
  }

  // ── Helper to create attributes ───────────────────────────
  async function createStringAttribute(
    collectionId: string,
    key: string,
    size: number,
    required: boolean,
    defaultValue?: string
  ) {
    try {
      await databases.createStringAttribute(
        DATABASE_ID,
        collectionId,
        key,
        size,
        required,
        defaultValue
      );
      console.log(`   + attribute '${key}' (string)`);
    } catch (err: unknown) {
      const error = err as { code?: number };
      if (error.code === 409) {
        console.log(`   ⏭️ attribute '${key}' already exists`);
      } else {
        throw err;
      }
    }
  }

  async function createIntegerAttribute(
    collectionId: string,
    key: string,
    required: boolean
  ) {
    try {
      await databases.createIntegerAttribute(
        DATABASE_ID,
        collectionId,
        key,
        required
      );
      console.log(`   + attribute '${key}' (integer)`);
    } catch (err: unknown) {
      const error = err as { code?: number };
      if (error.code === 409) {
        console.log(`   ⏭️ attribute '${key}' already exists`);
      } else {
        throw err;
      }
    }
  }

  async function createDatetimeAttribute(
    collectionId: string,
    key: string,
    required: boolean
  ) {
    try {
      await databases.createDatetimeAttribute(
        DATABASE_ID,
        collectionId,
        key,
        required
      );
      console.log(`   + attribute '${key}' (datetime)`);
    } catch (err: unknown) {
      const error = err as { code?: number };
      if (error.code === 409) {
        console.log(`   ⏭️ attribute '${key}' already exists`);
      } else {
        throw err;
      }
    }
  }

  async function createIndex(
    collectionId: string,
    key: string,
    type: IndexType,
    attributes: string[],
    orders?: ("asc" | "desc")[]
  ) {
    try {
      await databases.createIndex(
        DATABASE_ID,
        collectionId,
        key,
        type,
        attributes,
        orders
      );
      console.log(`   + index '${key}'`);
    } catch (err: unknown) {
      const error = err as { code?: number };
      if (error.code === 409) {
        console.log(`   ⏭️ index '${key}' already exists`);
      } else {
        throw err;
      }
    }
  }

  // ── Wait for attributes to be available ──────────────────
  function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ── Projects Collection ──────────────────────────────────
  await createCollection("projects", "Projects");
  await createStringAttribute("projects", "userId", 36, true);
  await createStringAttribute("projects", "name", 256, true);
  await createStringAttribute("projects", "description", 2048, false);
  console.log("   ⏳ Waiting for attributes to sync...");
  await wait(3000);
  await createIndex("projects", "idx_userId", IndexType.Key, ["userId"]);

  // ── Chats Collection ─────────────────────────────────────
  await createCollection("chats", "Chats");
  await createStringAttribute("chats", "userId", 36, true);
  await createStringAttribute("chats", "projectId", 36, false);
  await createStringAttribute("chats", "title", 256, true, "New Chat");
  await createStringAttribute("chats", "model", 128, true, "deepseek-ai/deepseek-v4-flash");
  await createDatetimeAttribute("chats", "updatedAt", true);
  console.log("   ⏳ Waiting for attributes to sync...");
  await wait(3000);
  await createIndex("chats", "idx_userId", IndexType.Key, ["userId"]);
  await createIndex("chats", "idx_userId_updatedAt", IndexType.Key, ["userId", "updatedAt"], ["asc", "desc"]);
  await createIndex("chats", "idx_projectId", IndexType.Key, ["projectId"]);

  // ── Messages Collection ──────────────────────────────────
  await createCollection("messages", "Messages");
  await createStringAttribute("messages", "chatId", 36, true);
  await createStringAttribute("messages", "role", 16, true);
  await createStringAttribute("messages", "content", 1000000, true);
  console.log("   ⏳ Waiting for attributes to sync...");
  await wait(3000);
  await createIndex("messages", "idx_chatId", IndexType.Key, ["chatId"]);

  // ── Files Collection ─────────────────────────────────────
  await createCollection("files", "Files");
  await createStringAttribute("files", "userId", 36, true);
  await createStringAttribute("files", "chatId", 36, true);
  await createStringAttribute("files", "name", 256, true);
  await createStringAttribute("files", "storagePath", 512, true);
  await createStringAttribute("files", "mimeType", 128, false);
  await createIntegerAttribute("files", "sizeBytes", false);
  console.log("   ⏳ Waiting for attributes to sync...");
  await wait(3000);
  await createIndex("files", "idx_userId", IndexType.Key, ["userId"]);
  await createIndex("files", "idx_chatId", IndexType.Key, ["chatId"]);

  // ── Storage Bucket ───────────────────────────────────────
  try {
    await storage.createBucket(
      BUCKET_ID,
      "Flux Uploads",
      [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.delete(Role.users()),
      ],
      false, // fileSecurity
      undefined, // enabled
      50 * 1024 * 1024 // maxFileSize: 50MB
    );
    console.log("\n✅ Storage bucket 'flux-uploads' created");
  } catch (err: unknown) {
    const error = err as { code?: number };
    if (error.code === 409) {
      console.log("\n⏭️  Storage bucket 'flux-uploads' already exists");
    } else {
      throw err;
    }
  }

  console.log("\n🎉 Appwrite setup complete! You can now run: npm run dev");
}

main().catch((err) => {
  console.error("\n❌ Setup failed:", err);
  process.exit(1);
});
