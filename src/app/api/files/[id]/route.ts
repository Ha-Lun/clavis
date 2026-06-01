import { createSessionClient, createAdminClient } from "@/lib/appwrite/server";
import { COLLECTIONS, BUCKET_ID } from "@/lib/appwrite/config";
import { NextRequest, NextResponse } from "next/server";
import { FileRecord } from "@/lib/appwrite/types";

export async function DELETE(
  _request: NextRequest,
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

    const fileDoc = await admin.databases.getDocument(
      dbId,
      COLLECTIONS.FILES,
      params.id
    ) as unknown as FileRecord;

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

export async function PUT(
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

    const fileDoc = await admin.databases.getDocument(
      dbId,
      COLLECTIONS.FILES,
      params.id
    ) as unknown as FileRecord;

    if (fileDoc.user_id !== user.$id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const updateData: any = {};
    if (body.chat_id !== undefined) updateData.chat_id = body.chat_id;
    if (body.project_id !== undefined) updateData.project_id = body.project_id;

    if (Object.keys(updateData).length > 0) {
      await admin.databases.updateDocument(
        dbId,
        COLLECTIONS.FILES,
        params.id,
        updateData
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("File update error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
