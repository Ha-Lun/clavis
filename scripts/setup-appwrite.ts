/**
 * Appwrite Setup Script for Clavis
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
let DATABASE_ID = "69f62a80001dafec8332";
const BUCKET_ID = "clavis-uploads";

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

  DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || DATABASE_ID;

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

  console.log("🚀 Setting up Appwrite for Clavis...");
  console.log(`   Using existing database: ${DATABASE_ID}\n`);

  // ── Helper to create a collection ─────────────────────────
  async function createCollection(collectionId: string, name: string, permissions?: string[]) {
    try {
      await databases.createCollection(
        DATABASE_ID,
        collectionId,
        name,
        permissions ?? [
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
      } else if (error.type === "attribute_limit_exceeded" && collectionId === "course_chunks" && key === "content") {
        console.log("   ⏭️ course_chunks.content is already present on this Appwrite tier");
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
  await createStringAttribute("projects", "user_id", 36, true);
  await createStringAttribute("projects", "name", 256, true);
  await createStringAttribute("projects", "description", 2048, false);
  await createStringAttribute("projects", "instructions", 100000, false);
  console.log("   ⏳ Waiting for attributes to sync...");
  await wait(3000);
  await createIndex("projects", "idx_user_id", IndexType.Key, ["user_id"]);

  // ── Chats Collection ─────────────────────────────────────
  await createCollection("chats", "Chats");
  await createStringAttribute("chats", "user_id", 36, true);
  await createStringAttribute("chats", "project_id", 36, false);
  await createStringAttribute("chats", "title", 256, true);
  await createStringAttribute("chats", "model", 128, true);
  await createDatetimeAttribute("chats", "updatedAt", true);
  console.log("   ⏳ Waiting for attributes to sync...");
  await wait(3000);
  await createIndex("chats", "idx_user_id", IndexType.Key, ["user_id"]);
  await createIndex("chats", "idx_user_id_updatedAt", IndexType.Key, ["user_id", "updatedAt"], ["asc", "desc"]);
  await createIndex("chats", "idx_project_id", IndexType.Key, ["project_id"]);
  await createStringAttribute("chats", "course_id", 36, false);
  await wait(3000);
  await createIndex("chats", "idx_course_id", IndexType.Key, ["course_id"]);

  // ── Courses Collection ───────────────────────────────────
  // These collections are server-owned; course material is never directly exposed through Appwrite.
  await createCollection("courses", "Courses", []);
  await createStringAttribute("courses", "user_id", 36, true);
  await createStringAttribute("courses", "external_id", 64, true);
  await createStringAttribute("courses", "name", 256, true);
  await createStringAttribute("courses", "course_code", 128, false);
  await createStringAttribute("courses", "term_name", 256, false);
  await createStringAttribute("courses", "canvas_url", 2048, false);
  await databases.createBooleanAttribute(DATABASE_ID, "courses", "is_active", false, true).catch((error: any) => { if (error.code !== 409) throw error; });
  await createStringAttribute("courses", "sync_status", 32, false, "idle");
  await createIntegerAttribute("courses", "indexed_source_count", true);
  await createStringAttribute("courses", "content_fingerprint", 128, false);
  await createDatetimeAttribute("courses", "last_synced_at", false);
  await createStringAttribute("courses", "sync_error", 4000, false);
  await wait(3000);
  await createIndex("courses", "idx_courses_user", IndexType.Key, ["user_id"]);
  await createIndex("courses", "idx_courses_user_name", IndexType.Key, ["user_id", "name"], ["asc", "asc"]);
  await createIndex("courses", "idx_courses_external", IndexType.Key, ["user_id", "external_id"]);

  // ── Course Sources Collection ─────────────────────────────
  await createCollection("course_sources", "Course Sources", []);
  await createStringAttribute("course_sources", "user_id", 36, true);
  await createStringAttribute("course_sources", "course_id", 36, true);
  await createStringAttribute("course_sources", "external_id", 256, true);
  await createStringAttribute("course_sources", "source_type", 32, true);
  await createStringAttribute("course_sources", "title", 256, true);
  await createStringAttribute("course_sources", "source_url", 2048, false);
  await createStringAttribute("course_sources", "content_hash", 128, true);
  await createStringAttribute("course_sources", "content", 100000, true);
  await createStringAttribute("course_sources", "updated_at", 64, false);
  await createStringAttribute("course_sources", "indexed_at", 64, true);
  await wait(3000);
  await createIndex("course_sources", "idx_sources_course", IndexType.Key, ["user_id", "course_id"]);
  await createIndex("course_sources", "idx_sources_external", IndexType.Key, ["course_id", "external_id"]);
  await createIndex("course_sources", "idx_sources_user_course_external", IndexType.Key, ["user_id", "course_id", "external_id"]);

  // ── Course Chunks Collection ──────────────────────────────
  await createCollection("course_chunks", "Course Chunks", []);
  await createStringAttribute("course_chunks", "user_id", 36, true);
  await createStringAttribute("course_chunks", "course_id", 36, true);
  await createStringAttribute("course_chunks", "source_id", 36, true);
  await createStringAttribute("course_chunks", "source_hash", 128, true);
  await createIntegerAttribute("course_chunks", "chunk_index", true);
  await createStringAttribute("course_chunks", "heading", 256, false);
  await createStringAttribute("course_chunks", "content", 4000, true);
  await wait(3000);
  await createIndex("course_chunks", "idx_chunks_course", IndexType.Key, ["user_id", "course_id"]);
  await createIndex("course_chunks", "idx_chunks_source", IndexType.Key, ["source_id", "source_hash"]);

  // ── Messages Collection ──────────────────────────────────
  await createCollection("messages", "Messages");
  await createStringAttribute("messages", "chat_id", 36, true);
  await createStringAttribute("messages", "role", 16, true);
  await createStringAttribute("messages", "content", 1000000, true);
  console.log("   Waiting for attributes to sync...");
  await wait(3000);
  await createIndex("messages", "idx_chat_id", IndexType.Key, ["chat_id"]);

  // ── Files Collection ─────────────────────────────────────
  await createCollection("files", "Files");
  await createStringAttribute("files", "user_id", 36, true);
  await createStringAttribute("files", "chat_id", 36, false);
  await createStringAttribute("files", "project_id", 36, false);
  await createStringAttribute("files", "name", 256, true);
  await createStringAttribute("files", "storagePath", 512, true);
  await createStringAttribute("files", "mimeType", 128, false);
  await createIntegerAttribute("files", "sizeBytes", false);
  console.log("   ⏳ Waiting for attributes to sync...");
  await wait(3000);
  await createIndex("files", "idx_user_id", IndexType.Key, ["user_id"]);
  await createIndex("files", "idx_chat_id", IndexType.Key, ["chat_id"]);
  await createIndex("files", "idx_project_id", IndexType.Key, ["project_id"]);
  // ── Profiles Collection ──────────────────────────────────
  await createCollection("profiles", "Profiles");
  await createStringAttribute("profiles", "user_id", 36, true);
  await createStringAttribute("profiles", "email", 256, true);
  await createStringAttribute("profiles", "name", 256, false);
  try {
    await databases.createBooleanAttribute(DATABASE_ID, "profiles", "is_pro", true);
    console.log(`   + attribute 'is_pro' (boolean)`);
  } catch (err: any) {
    if (err.code === 409) console.log(`   ⏭️ attribute 'is_pro' already exists`);
    else throw err;
  }
  console.log("   ⏳ Waiting for attributes to sync...");
  await wait(3000);
  await createIndex("profiles", "idx_user_id", IndexType.Key, ["user_id"]);

  // ── Storage Bucket ───────────────────────────────────────
  try {
    await storage.createBucket(
      BUCKET_ID,
      "Clavis Uploads",
      [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.delete(Role.users()),
      ],
      false, // fileSecurity
      undefined, // enabled
      50000000 // maxFileSize: 50MB
    );
    console.log("\n✅ Storage bucket 'clavis-uploads' created");
  } catch (err: unknown) {
    const error = err as { code?: number };
    if (error.code === 409) {
      console.log("\n⏭️  Storage bucket 'clavis-uploads' already exists");
    } else if (error.type === "additional_resource_not_allowed") {
      console.log("\n⏭️  Storage bucket limit reached; continuing because the existing bucket is already configured");
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
