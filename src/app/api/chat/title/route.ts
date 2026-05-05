import { createSessionClient, createAdminClient } from "@/lib/appwrite/server";
import { createNvidiaClient } from "@/lib/nvidia";
import { DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config";
import { NextRequest, NextResponse } from "next/server";
import type { ChatCompletion } from "openai/resources/index.mjs";

export const dynamic = "force-dynamic";

async function callAIWithRetry(
  nvidia: ReturnType<typeof createNvidiaClient>,
  model: string,
  messages: { role: "system" | "user" | "assistant"; content: string }[]
): Promise<ChatCompletion> {
  const maxRetries = 2;
  const timeoutMs = 25000;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log("[title] AI attempt", attempt + 1);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Request timed out")), timeoutMs)
      );
      
      const aiPromise = nvidia.chat.completions.create({
        model,
        messages,
        max_tokens: 20,
      });
      
      return await Promise.race([aiPromise, timeoutPromise]) as unknown as ChatCompletion;
    } catch (err: any) {
      const isTimeout = err.message?.toLowerCase().includes("timed out");
      const isConnectionError = err.message?.toLowerCase().includes("connection") || err.cause?.code === "ETIMEDOUT";
      
      console.error("[title] AI attempt failed:", err.message);
      
      if (attempt < maxRetries && (isTimeout || isConnectionError)) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
  throw new Error("Title generation failed");
}

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

    const completion = await callAIWithRetry(
      nvidia,
      model || "deepseek-ai/deepseek-v4-flash",
      [
        {
          role: "system",
          content:
            "Generate a very short title (maximum 4 words) for a chat that starts with the following message. Reply with ONLY the title, no quotes, no punctuation at the end.",
        },
        {
          role: "user",
          content: firstMessage,
        },
      ]
    );

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
  } catch (err: any) {
    console.error("Title generation error:", err.message);
    return NextResponse.json(
      { error: err.message || "Failed to generate title" },
      { status: 500 }
    );
  }
}