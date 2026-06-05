import { createAdminClient } from "@/lib/appwrite/server";
import { DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config";

/**
 * Migration: Increase the `content` field on the FILES collection to 1,000,000 characters.
 * 
 * The previous limit (10,000) was too small for most PDFs and documents,
 * causing extracted text to be silently rejected or truncated by Appwrite.
 * 
 * IMPORTANT: Appwrite does NOT support in-place attribute resizing.
 * To increase the size, you must:
 *   1. Delete the old attribute
 *   2. Wait for Appwrite to propagate (~5s)
 *   3. Create a new attribute with the larger size
 * 
 * WARNING: This will lose any existing `content` data in the FILES collection.
 * If you need to preserve data, export it first.
 */
async function migrate() {
  console.log("🚀 Starting Files collection schema migration...");

  try {
    const admin = await createAdminClient();
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || DATABASE_ID;
    const collectionId = COLLECTIONS.FILES;

    if (!dbId) {
      throw new Error("DATABASE_ID is not defined. Please check your .env.local file.");
    }

    console.log(`Checking attributes for collection: ${collectionId} in database: ${dbId}`);

    // Fetch existing attributes to avoid duplicates
    const attributesResult = await admin.databases.listAttributes(dbId, collectionId);
    const existingAttributes = new Map(
      attributesResult.attributes.map((attr: any) => [attr.key, attr])
    );
    console.log("Existing attributes:", Array.from(existingAttributes.keys()));

    // --- Handle content field migration (10k -> 1M) ---
    const contentAttr = existingAttributes.get("content") as any;
    if (contentAttr) {
      const currentSize = contentAttr.size || 0;
      console.log(`\nContent field exists with size: ${currentSize}`);

      if (currentSize < 1_000_000) {
        console.log(`⚠️  Content field is too small (${currentSize}). Needs to be 1,000,000.`);
        console.log(`Deleting old content attribute...`);

        await admin.databases.deleteAttribute(dbId, collectionId, "content");
        console.log(`Deleted. Waiting 8s for Appwrite to propagate...`);
        await new Promise((r) => setTimeout(r, 8000));

        console.log(`Creating new content attribute (size: 1,000,000)...`);
        await admin.databases.createStringAttribute(
          dbId,
          collectionId,
          "content",
          1_000_000,
          false // not required
        );
        console.log(`✅ Content attribute recreated with 1,000,000 char limit`);
      } else {
        console.log(`✅ Content field already has sufficient size (${currentSize}). Skipping.`);
      }
    } else {
      console.log(`Content attribute doesn't exist. Creating with size 1,000,000...`);
      await admin.databases.createStringAttribute(
        dbId,
        collectionId,
        "content",
        1_000_000,
        false
      );
      console.log(`✅ Content attribute created with 1,000,000 char limit`);
    }

    // --- Ensure other attributes exist ---
    const otherAttributes = [
      { key: "project_id", size: 255 },
      { key: "file_id", size: 255 },
    ];

    for (const attr of otherAttributes) {
      if (existingAttributes.has(attr.key)) {
        console.log(`✅ Attribute ${attr.key} already exists. Skipping.`);
        continue;
      }

      console.log(`Adding attribute ${attr.key} (size: ${attr.size})...`);
      await admin.databases.createStringAttribute(
        dbId,
        collectionId,
        attr.key,
        attr.size,
        false
      );
      console.log(`Successfully added ${attr.key}`);
    }

    console.log("\n✨ Migration completed successfully! Please wait a few moments for Appwrite to propagate changes.");
  } catch (err: any) {
    console.error("\n❌ Migration failed:");
    console.error(err);
    process.exit(1);
  }
}

migrate();
