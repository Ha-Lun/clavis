import { createSessionClient, createAdminClient } from "@/lib/appwrite/server";
import { createNvidiaClient } from "@/lib/nvidia";
import { DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config";
import { NextRequest } from "next/server";
import { ID, Query } from "node-appwrite";
import type {
  ChatCompletion,
  ChatCompletionChunk,
} from "openai/resources/index.mjs";

export const dynamic = "force-dynamic";

export const FLUX_SYSTEM_PROMPT = `You are **Flux**, an expert AI advisor built for technical and creative work. You operate as a senior peer—precise, direct, and deeply knowledgeable.

### 1. Language Protocol
*   **Mirror the User:** Always respond in the **same language** as the user message unless explicitly asked otherwise.
*   **Technical Terms:** Maintain standard technical terminology (e.g., in English) if that is the industry standard in the language of the user, but keep the prose consistent.

### 2. Personality & Tone
*   **Peer-to-Peer:** Treat the user as technically proficient. No hand-holding or over-explaining basics.
*   **Anti-Sycophancy:** Never use filler phrases or canned transitions (e.g., "Certainly!", "Great question!", "I would be happy to help").
*   **Directness:** Give definitive recommendations rather than a list of endless options. If a "best" path exists, lead with it.
*   **Honesty:** If a solution is hacky or if you are unsure, state it plainly. Say "I am not sure" rather than guessing.
*   **Constraint:** Never start a response or a sentence with the word "I" (e.g., instead of "I recommend using...", use "Use...").

### 3. Response Architecture
*   **Answer First:** Lead with the solution or the direct answer. Provide context, depth, and explanations only after the core information.
*   **Prose for Simplicity:** Use plain sentences for short questions or casual exchanges. Do not use bullets or headers for simple answers.
*   **Structured Lists:** Use lists only for enumerable steps, comparisons, or options. Each item should be a full sentence.
*   **Strategic Markdown:** 
    *   Use "##" and "###" headers only for multi-section documentation or long guides.
    *   Use **bold** only for the most critical term or action.
    *   Never use italics or bold for "decoration."
    *   No "bullet-point padding"—if it reads well as a paragraph, keep it as a paragraph.

### 4. Technical & Code Standards
*   **Code Blocks:** Wrap all code, paths, and commands in fenced code blocks with correct language tags.
*   **Style:** Prefer modern syntax, performance-optimized patterns, and industry best practices.
*   **Proactive Review:** Point out potential bugs, security edge cases, or significant trade-offs without being prompted.
*   **Sequence:** For code-heavy questions, provide the working block first, then the technical breakdown.

### 5. Interaction Guardrails
*   No conversational padding. 
*   No apologies for previous mistakes; simply provide the correction.
*   Maintain a precise, senior-engineer-reviewing-PR tone.`;

type MessageParam = { role: "system" | "user" | "assistant"; content: string };

async function callAIWithRetry(
  nvidia: ReturnType<typeof createNvidiaClient>,
  model: string,
  messages: MessageParam[],
  maxRetries: number = 2,
  timeoutMs: number = 30000,
) {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[API /chat] AI attempt ${attempt + 1}/${maxRetries + 1}...`);

      // Create promise with timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out")), timeoutMs),
      );

      const aiPromise = nvidia.chat.completions.create({
        model,
        messages: [
          { role: "system", content: FLUX_SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
        max_tokens: 4096,
      });

      const completion = await Promise.race([aiPromise, timeoutPromise]);
      console.log("[API /chat] AI call succeeded");
      return completion;
    } catch (err: any) {
      lastError = err;
      const isTimeout = err.message?.toLowerCase().includes("timed out");
      const isConnectionError =
        err.message?.toLowerCase().includes("connection") ||
        err.cause?.code === "ETIMEDOUT";
      const is429 = err.status === 429;

      console.error(
        `[API /chat] AI attempt ${attempt + 1} failed:`,
        err.message,
      );

      if (is429) {
        // Don't retry 429s immediately, wait a bit
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }
        throw new Error("Model is busy. Please try again in a moment.");
      }

      // Only retry on timeout or connection errors
      if (!isTimeout && !isConnectionError) {
        throw err;
      }

      // Wait before retry with exponential backoff
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`[API /chat] Retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError || new Error("AI request failed after retries");
}

export async function POST(request: NextRequest) {
  console.log("[API /chat] START: Received request");

  try {
    const client = await createSessionClient();
    console.log("[API /chat] Session client created");

    if (!client) {
      console.log("[API /chat] No session client - 401");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const user = await client.account.get();
    console.log("[API /chat] User:", user.email);

    const { chatId, message, model } = await request.json();
    console.log("[API /chat] Request:", {
      chatId: chatId?.slice(0, 20),
      message: message?.slice(0, 30),
      model,
    });

    if (!chatId || !message || !model) {
      console.log("[API /chat] Missing fields - 400");
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 },
      );
    }

    const admin = await createAdminClient();
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
    console.log("[API /chat] Admin client, dbId:", dbId);

    // Verify chat belongs to user
    try {
      const chat = await admin.databases.getDocument(
        dbId,
        COLLECTIONS.CHATS,
        chatId,
      );
      console.log(
        "[API /chat] Chat found:",
        chat.title,
        "user_id match:",
        chat.user_id === user.$id,
      );

      if (chat.user_id !== user.$id) {
        console.log("[API /chat] Chat not owned by user - 404");
        return new Response(JSON.stringify({ error: "Chat not found" }), {
          status: 404,
        });
      }
    } catch (err) {
      console.log("[API /chat] Chat fetch error:", err);
      return new Response(JSON.stringify({ error: "Chat not found" }), {
        status: 404,
      });
    }

    // Save user message to DB IMMEDIATELY (before AI call) - ensures persistence on refresh
    console.log("[API /chat] Saving user message to DB first...");
    await admin.databases.createDocument(
      dbId,
      COLLECTIONS.MESSAGES,
      ID.unique(),
      {
        chat_id: chatId,
        role: "user",
        content: message,
      },
    );

    // Query history to get context (now including the message just saved)
    const history = await admin.databases.listDocuments(
      dbId,
      COLLECTIONS.MESSAGES,
      [
        Query.equal("chat_id", chatId),
        Query.orderAsc("$createdAt"),
        Query.limit(99), // Leave room for current message
      ],
    );

    // Build message list - ONLY previous messages (not current)
    // Current message is already in UI and will be included via chat context if needed
    const messages: MessageParam[] = history.documents.map((m) => ({
      role: m.role as "system" | "user" | "assistant",
      content: m.content as string,
    }));

    // Add current user message to context (without saving to avoid duplicate)
    messages.push({ role: "user", content: message });

    console.log(
      "[API /chat] Messages for AI:",
      messages.length,
      "(history + current)",
    );

    // Call NVIDIA NIM with retry
    console.log("[API /chat] Creating NVIDIA client, model:", model);

    let nvidia;
    try {
      nvidia = createNvidiaClient();
    } catch (err: any) {
      console.error("[API /chat] NVIDIA client error:", err.message);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
      });
    }

    let completion;
    try {
      console.log("[API /chat] Calling NVIDIA API with retry...");
      completion = await callAIWithRetry(nvidia, model, messages);
    } catch (err: any) {
      console.error("[API /chat] NVIDIA API error after retries:", err.message);
      if (err.status === 429 || err.message?.includes("busy")) {
        return new Response(
          JSON.stringify({
            error: "Model is busy. Please try again in a moment.",
          }),
          { status: 429 },
        );
      }

      const errorMessage =
        err.message || "Failed to communicate with AI provider";
      return new Response(
        JSON.stringify({
          error: errorMessage.toLowerCase().includes("timeout")
            ? "The request timed out. Please try again."
            : `AI Error: ${errorMessage}`,
        }),
        { status: err.status || 500 },
      );
    }

    // Stream response
    let fullContent = "";
    let chunkCount = 0;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log("[API /chat] Starting stream...");
          const streamingCompletion =
            completion as AsyncIterable<ChatCompletionChunk>;
          for await (const chunk of streamingCompletion) {
            const content = chunk.choices[0]?.delta?.content ?? "";
            if (content) {
              chunkCount++;
              fullContent += content;
              controller.enqueue(new TextEncoder().encode(content));
            }
          }
          console.log(
            "[API /chat] Stream done, chunks:",
            chunkCount,
            "content length:",
            fullContent.length,
          );

          // Save complete assistant message
          await admin.databases.createDocument(
            dbId,
            COLLECTIONS.MESSAGES,
            ID.unique(),
            {
              chat_id: chatId,
              role: "assistant",
              content: fullContent,
            },
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
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
