import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";
import { DATABASE_ID, COLLECTIONS, BUCKET_ID } from "@/lib/appwrite/config";
import { NextRequest, NextResponse } from "next/server";
import { ID, InputFile, Query } from "node-appwrite";

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

    // Check upload limits for free tier
    const prefs: any = await client.account.getPrefs();
    const tier = prefs.subscriptionTier || "free";
    
    if (tier !== "pro") {
      const existingFiles = await admin.databases.listDocuments(
        dbId,
        COLLECTIONS.FILES,
        [Query.equal("user_id", user.$id), Query.limit(1)]
      );

      if (existingFiles.total >= 5) {
        return NextResponse.json(
          { error: "Free tier limit reached (5 files max). Please upgrade to Pro to upload more files." },
          { status: 403 }
        );
      }
    }

    // Upload to storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const inputFile = InputFile.fromBuffer(buffer, file.name);
    const uploadedFile = await admin.storage.createFile(BUCKET_ID, ID.unique(), inputFile);
    const actualFileId = uploadedFile.$id;

    // Build file URL
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
    const projectIdEnv = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
    const fileUrl = `${endpoint}/storage/buckets/${BUCKET_ID}/files/${actualFileId}/view?project=${projectIdEnv}`;

    // Text Extraction
    let extractedText = null;

    try {
      const { exec } = await import("child_process");
      const util = await import("util");
      const fs = await import("fs/promises");
      const path = await import("path");
      const os = await import("os");

      const execAsync = util.promisify(exec);

      // Create a temporary file
      const tempDir = os.tmpdir();
      const ext = path.extname(file.name) || "";
      const tempFileName = `upload-${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
      const tempFilePath = path.join(tempDir, tempFileName);
      
      await fs.writeFile(tempFilePath, buffer);

      try {
        // Run markitdown
        const execEnv = { ...process.env, PATH: `${process.env.PATH || ''}:/home/hannes/.local/bin` };
        const { stdout } = await execAsync(`markitdown "${tempFilePath}"`, { maxBuffer: 1024 * 1024 * 10, env: execEnv });
        extractedText = stdout.trim();
      } catch (execErr: any) {
        console.error("markitdown execution error:", execErr);
        // Fallback for plain text if markitdown fails or is not installed
        if (
          file.type.startsWith("text/") || 
          [".md", ".py", ".js", ".ts", ".tsx", ".css", ".json", ".txt"].some(e => file.name.endsWith(e))
        ) {
           extractedText = buffer.toString('utf-8');
        }
      } finally {
        // Clean up
        await fs.unlink(tempFilePath).catch(e => console.error("Temp file cleanup failed:", e));
      }
    } catch (err) {
      console.error("Text extraction setup error:", err);
    }

    if (extractedText && extractedText.length > 1000000) {
      console.log(`[API /upload] Truncating DB saved content from ${extractedText.length} to 1M chars`);
      extractedText = extractedText.slice(0, 1000000);
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

    return NextResponse.json({ file: fileRecord, url: fileUrl });
  } catch (err: any) {
    console.error("Upload API error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
