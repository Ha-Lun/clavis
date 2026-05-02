import { createSessionClient, createAdminClient } from "@/lib/appwrite/server";
import { DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config";
import { NextRequest, NextResponse } from "next/server";
import { Query } from "node-appwrite";

export async function PATCH(
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

    // Verify ownership
    const existing = await admin.databases.getDocument(
      dbId,
      COLLECTIONS.CHATS,
      params.id
    );

    if (existing.user_id !== user.$id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const updates: Record<string, string> = {};

    if (body.title !== undefined) updates.title = body.title;
    if (body.model !== undefined) updates.model = body.model;

    const chat = await admin.databases.updateDocument(
      dbId,
      COLLECTIONS.CHATS,
      params.id,
      updates
    );

    return NextResponse.json({ chat });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    // Verify ownership
    const existing = await admin.databases.getDocument(
      dbId,
      COLLECTIONS.CHATS,
      params.id
    );

    if (existing.user_id !== user.$id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Manually cascade: delete all messages in this chat
    const messages = await admin.databases.listDocuments(
      dbId,
      COLLECTIONS.MESSAGES,
      [Query.equal("chat_id", params.id), Query.limit(100)]
    );

    for (const msg of messages.documents) {
      await admin.databases.deleteDocument(
        dbId,
        COLLECTIONS.MESSAGES,
        msg.$id
      );
    }

    // Delete the chat
    await admin.databases.deleteDocument(
      dbId,
      COLLECTIONS.CHATS,
      params.id
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
