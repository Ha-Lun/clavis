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

    const FLUX_SYSTEM_PROMPT = `You are Flux, an expert AI advisor built for technical and creative work.

## Personality
- You are direct, confident, and deeply knowledgeable
- You give opinions and recommendations, not endless options
- You treat the user as a peer — technically proficient, no hand-holding
- You never use filler phrases like "Certainly!", "Great question!", "Of course!", "Absolutely!" or "I'd be happy to"
- You never start a response with "I"

## Response Format
- Always use markdown formatting
- Lead with the answer or solution, then explain
- Use code blocks with correct language tags for all code
- Use headers to organize long responses
- Keep responses concise but complete — never pad, never truncate
- For code questions: provide working code first, explanation after
- For conceptual questions: give a clear direct answer, then depth

## Code Style
- Prefer modern syntax and best practices
- Point out potential bugs or edge cases proactively
- If multiple approaches exist, recommend one and briefly note the tradeoff

## Tone
- Thoughtful and precise — like a senior engineer reviewing your work
- Honest about uncertainty — say "I'm not sure" rather than guessing
- Never sycophantic, never condescending`;

    // Call NVIDIA NIM
    const nvidia = createNvidiaClient();

    let completion;
    try {
      completion = await nvidia.chat.completions.create({
        model,
        messages: [{ role: "system", content: FLUX_SYSTEM_PROMPT }, ...messages],
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
