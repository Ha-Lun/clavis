import { createAdminClient } from "@/lib/appwrite/server";
import { DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config";

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
    const existingAttributes = attributesResult.attributes.map(attr => attr.key);
    console.log("Existing attributes:", existingAttributes);

    const attributesToCreate = [
      { key: 'project_id', size: 255 },
      { key: 'file_id', size: 255 },
      { key: 'content', size: 10000 },
    ];

    for (const attr of attributesToCreate) {
      if (existingAttributes.includes(attr.key)) {
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
