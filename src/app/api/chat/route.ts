import { createSessionClient, createAdminClient } from "@/lib/appwrite/server";
import { createNvidiaClient } from "@/lib/nvidia";
import { DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config";
import { NextRequest } from "next/server";
import { ID, Query } from "node-appwrite";

export async function POST(request: NextRequest) {
  try {
    const client = await createSessionClient();
    if (!client) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const user = await client.account.get();
    const { chatId, message, model } = await request.json();

    if (!chatId || !message || !model) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    const admin = await createAdminClient();
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

    // Verify chat belongs to user
    try {
      const chat = await admin.databases.getDocument(
        dbId,
        COLLECTIONS.CHATS,
        chatId
      );
      if (chat.user_id !== user.$id) {
        return new Response(JSON.stringify({ error: "Chat not found" }), {
          status: 404,
        });
      }
    } catch {
      return new Response(JSON.stringify({ error: "Chat not found" }), {
        status: 404,
      });
    }

    // Save user message
    await admin.databases.createDocument(
      dbId,
      COLLECTIONS.MESSAGES,
      ID.unique(),
      {
        chat_id: chatId,
        role: "user",
        content: message,
      }
    );



    // Get full message history
    const history = await admin.databases.listDocuments(
      dbId,
      COLLECTIONS.MESSAGES,
      [
        Query.equal("chat_id", chatId),
        Query.orderAsc("$createdAt"),
        Query.limit(100),
      ]
    );

    const messages = history.documents.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content as string,
    }));

    // Call NVIDIA NIM
    const nvidia = createNvidiaClient();

    let completion;
    try {
      completion = await nvidia.chat.completions.create({
        model,
        messages,
        stream: true,
        max_tokens: 4096,
      });
    } catch (err: any) {
      console.error("NVIDIA API error:", err);
      if (err.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Model is busy, please try again in a moment.",
          }),
          { status: 429 }
        );
      }
      
      const errorMessage = err.message || "Failed to communicate with AI provider";
      return new Response(
        JSON.stringify({
          error: errorMessage.toLowerCase().includes("timeout") 
            ? "The request to the AI model timed out. Please try again."
            : `AI Provider Error: ${errorMessage}`,
        }),
        { status: err.status || 500 }
      );
    }

    // Stream response
    let fullContent = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content ?? "";
            if (content) {
              fullContent += content;
              controller.enqueue(new TextEncoder().encode(content));
            }
          }

          // Save complete assistant message
          await admin.databases.createDocument(
            dbId,
            COLLECTIONS.MESSAGES,
            ID.unique(),
            {
              chat_id: chatId,
              role: "assistant",
              content: fullContent,
            }
          );

          controller.close();
        } catch (err) {
          console.error("Stream error:", err);
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err) {
    console.error("Chat API error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}
