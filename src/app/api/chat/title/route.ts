import { createSessionClient, createAdminClient } from "@/lib/appwrite/server";
import { COLLECTIONS } from "@/lib/appwrite/config";
import { NextRequest, NextResponse } from "next/server";
import { Chat } from "@/lib/appwrite/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const client = await createSessionClient();
    if (!client) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await client.account.get();
    const { chatId, firstMessage } = await request.json();

    if (!chatId || !firstMessage) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Use the first prompt as the title, truncated if too long
    const title = firstMessage.length > 40 
      ? firstMessage.substring(0, 40) + "..." 
      : firstMessage;

    const admin = await createAdminClient();
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

    // Update chat title — verify ownership
    const chat = await admin.databases.getDocument(
      dbId,
      COLLECTIONS.CHATS,
      chatId
    ) as unknown as Chat;

    if (chat.user_id !== user.$id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await admin.databases.updateDocument(
      dbId,
      COLLECTIONS.CHATS,
      chatId,
      { title }
    );

    return NextResponse.json({ title });
  } catch (err: any) {
    console.error("Title generation error:", err.message);
    return NextResponse.json(
      { error: err.message || "Failed to set title" },
      { status: 500 }
    );
  }
}