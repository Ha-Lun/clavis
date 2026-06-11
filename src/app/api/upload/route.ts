import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";
import { DATABASE_ID, COLLECTIONS, BUCKET_ID } from "@/lib/appwrite/config";
import { NextRequest, NextResponse } from "next/server";
import { ID, InputFile, Query } from "node-appwrite";
import { extractTextFromBuffer, MAX_EXTRACTED_CHARS } from "@/lib/extract-text";

export async function POST(request: NextRequest) {
  try {
    const client = await createSessionClient();
    if (!client) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await client.account.get();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const chatId = formData.get("chatId") as string | null;
    const projectId = formData.get("projectId") as string | null;

    if (!file || (!chatId && !projectId)) {
      return NextResponse.json(
        { error: "Missing file and either chatId or projectId" },
        { status: 400 }
      );
    }

    // Use admin client for storage (bypasses per-user bucket permissions)
    const admin = await createAdminClient();
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

    // Upload to storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const inputFile = InputFile.fromBuffer(buffer, file.name);
    const uploadedFile = await admin.storage.createFile(BUCKET_ID, ID.unique(), inputFile);
    const actualFileId = uploadedFile.$id;

    // Build file URL
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
    const projectIdEnv = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
    const fileUrl = `${endpoint}/storage/buckets/${BUCKET_ID}/files/${actualFileId}/view?project=${projectIdEnv}`;

    // Text Extraction using shared utility
    console.log(`[API /upload] Extracting text from ${file.name} (${file.size} bytes, type: ${file.type})`);
    const extraction = await extractTextFromBuffer(buffer, file.name, file.type);
    
    let extractedText = extraction.text;
    
    if (extractedText) {
      console.log(`[API /upload] Extracted ${extractedText.length} chars via ${extraction.method} for ${file.name}`);
      // Ensure we don't exceed Appwrite string attribute limit
      if (extractedText.length > MAX_EXTRACTED_CHARS) {
        console.log(`[API /upload] Truncating content from ${extractedText.length} to ${MAX_EXTRACTED_CHARS} chars`);
        extractedText = extractedText.slice(0, MAX_EXTRACTED_CHARS);
      }
    } else {
      console.warn(`[API /upload] No text extracted from ${file.name}: ${extraction.error || "unknown reason"}`);
    }

    // Save file record
    const fileRecord = await admin.databases.createDocument(
      dbId,
      COLLECTIONS.FILES,
      ID.unique(),
      {
        user_id: user.$id,
        chat_id: chatId || null,
        project_id: projectId || null,
        file_id: actualFileId,
        name: file.name,
        storagePath: `${user.$id}/${chatId || projectId}/${actualFileId}`,
        mimeType: file.type || null,
        sizeBytes: file.size || null,
        content: extractedText,
      }
    );

    console.log(`[API /upload] File record saved: ${fileRecord.$id}, content saved: ${!!extractedText}`);
    return NextResponse.json({ file: fileRecord, url: fileUrl });
  } catch (err: any) {
    console.error("Upload API error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
