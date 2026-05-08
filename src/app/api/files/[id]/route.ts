import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";
import { DATABASE_ID, COLLECTIONS, BUCKET_ID } from "@/lib/appwrite/config";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await createSessionClient();
    if (!client) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await client.account.get();
    const admin = await createAdminClient();
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

    // Get file record to find storage file ID
    const fileDoc = await admin.databases.getDocument(
      dbId,
      COLLECTIONS.FILES,
      params.id
    );

    if (fileDoc.user_id !== user.$id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const fileId = fileDoc.file_id;

    // Delete from storage
    if (fileId) {
      await admin.storage.deleteFile(BUCKET_ID, fileId);
    }

    // Delete from database
    await admin.databases.deleteDocument(
      dbId,
      COLLECTIONS.FILES,
      params.id
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("File delete error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
