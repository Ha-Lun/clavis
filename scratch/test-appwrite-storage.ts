import { createAdminClient } from "../src/lib/appwrite/server";
import { BUCKET_ID, COLLECTIONS } from "../src/lib/appwrite/config";
import { Query } from "node-appwrite";

async function run() {
  const admin = await createAdminClient();
  const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
  
  const files = await admin.databases.listDocuments(
    dbId,
    COLLECTIONS.FILES,
    [Query.limit(50)]
  );

  const fileDoc = files.documents.find(f => f.name.toLowerCase().endsWith(".pdf") && f.file_id);

  if (!fileDoc) {
    console.log("No PDF files found with file_id");
    return;
  }
  const fileId = fileDoc.file_id;
  const fileName = fileDoc.name;
  console.log(`Testing with file: ${fileName} (${fileId})`);

  try {
    const arrayBuffer = await admin.storage.getFileDownload(BUCKET_ID, fileId);
    const buffer = Buffer.from(arrayBuffer);
    console.log("Buffer length:", buffer.length);

    if (fileName.toLowerCase().endsWith(".pdf")) {
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: buffer });
      const data = await parser.getText();
      console.log("PDF parsed successfully, text length:", data.text.length);
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
