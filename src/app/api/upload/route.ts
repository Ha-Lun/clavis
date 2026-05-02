import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";
import { DATABASE_ID, COLLECTIONS, BUCKET_ID } from "@/lib/appwrite/config";
import { NextRequest, NextResponse } from "next/server";
import { ID } from "node-appwrite";

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

    if (!file || !chatId) {
      return NextResponse.json(
        { error: "Missing file or chatId" },
        { status: 400 }
      );
    }

    // Use admin client for storage (bypasses per-user bucket permissions)
    const admin = await createAdminClient();

    // Upload to storage
    const fileId = ID.unique();
    await admin.storage.createFile(BUCKET_ID, fileId, file);

    // Build file URL
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
    const fileUrl = `${endpoint}/storage/buckets/${BUCKET_ID}/files/${fileId}/view?project=${projectId}`;

    // Save file record
    const storagePath = `${user.$id}/${chatId}/${fileId}`;
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

    const fileRecord = await admin.databases.createDocument(
      dbId,
      COLLECTIONS.FILES,
      ID.unique(),
      {
        user_id: user.$id,
        chat_id: chatId,
        name: file.name,
        storagePath,
        mimeType: file.type || null,
        sizeBytes: file.size || null,
      }
    );

    return NextResponse.json({ file: fileRecord, url: fileUrl });
  } catch (err) {
    console.error("Upload API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
