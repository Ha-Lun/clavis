import { createSessionClient, createAdminClient } from "@/lib/appwrite/server";
import { createNvidiaClient } from "@/lib/nvidia";
import { DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const client = await createSessionClient();
    if (!client) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await client.account.get();
    const { chatId, firstMessage, model } = await request.json();

    if (!chatId || !firstMessage) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const nvidia = createNvidiaClient();

    const completion = await nvidia.chat.completions.create({
      model: model || "deepseek-ai/deepseek-v4-flash",
      messages: [
        {
          role: "system",
          content:
            "Generate a very short title (maximum 4 words) for a chat that starts with the following message. Reply with ONLY the title, no quotes, no punctuation at the end.",
        },
        {
          role: "user",
          content: firstMessage,
        },
      ],
      max_tokens: 20,
    });

    const title =
      completion.choices[0]?.message?.content?.trim() || "New Chat";

    const admin = await createAdminClient();
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

    // Update chat title — verify ownership
    const chat = await admin.databases.getDocument(
      dbId,
      COLLECTIONS.CHATS,
      chatId
    );

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
  } catch (err) {
    console.error("Title generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate title" },
      { status: 500 }
    );
  }
}
