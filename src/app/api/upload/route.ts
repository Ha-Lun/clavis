import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";
import { DATABASE_ID, COLLECTIONS, BUCKET_ID } from "@/lib/appwrite/config";
import { NextRequest, NextResponse } from "next/server";
import { ID } from "node-appwrite";
import { InputFile } from "node-appwrite/file";

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

    // Upload to storage
    const fileId = ID.unique();
    const buffer = Buffer.from(await file.arrayBuffer());
    const inputFile = InputFile.fromBuffer(buffer, file.name);
    await admin.storage.createFile(BUCKET_ID, fileId, inputFile);

    // Build file URL
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
    const projectIdEnv = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
    const fileUrl = `${endpoint}/storage/buckets/${BUCKET_ID}/files/${fileId}/view?project=${projectIdEnv}`;

    // PDF Parsing
    let extractedText = null;
    if (file.type === "application/pdf") {
      try {
        const pdfParseModule: any = await import('pdf-parse');
        const PDFParseClass = pdfParseModule.PDFParse || (pdfParseModule.default && pdfParseModule.default.PDFParse);
        if (!PDFParseClass) throw new Error("Could not find PDFParse constructor in module");

        const parser = new PDFParseClass({ data: buffer });
        const data = await parser.getText();
        extractedText = data.text;
      } catch (parseErr) {
        console.error("PDF parsing error:", parseErr);
      }
    }

    // Save file record
    const storagePath = `${user.$id}/${chatId || projectId}/${fileId}`;
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

    const fileRecord = await admin.databases.createDocument(
      dbId,
      COLLECTIONS.FILES,
      ID.unique(),
      {
        user_id: user.$id,
        chat_id: chatId,
        project_id: projectId,
        file_id: fileId,
        name: file.name,
        storagePath,
        mimeType: file.type || null,
        sizeBytes: file.size || null,
        content: extractedText,
      }
    );

    return NextResponse.json({ file: fileRecord, url: fileUrl });
  } catch (err: any) {
    console.error("Upload API error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
