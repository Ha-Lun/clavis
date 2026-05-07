import { createSessionClient, createAdminClient } from "@/lib/appwrite/server";
import { createNvidiaClient } from "@/lib/nvidia";
import { DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config";
import { FLUX_SYSTEM_PROMPT } from "@/lib/prompts";
import { NextRequest } from "next/server";
import { ID, Query } from "node-appwrite";
import type {
  ChatCompletion,
  ChatCompletionChunk,
} from "openai/resources/index.mjs";

export const dynamic = "force-dynamic";

type MessageParam = { role: "system" | "user" | "assistant"; content: string };

async function callAIWithRetry(
  nvidia: ReturnType<typeof createNvidiaClient>,
  model: string,
  messages: MessageParam[],
  signal: AbortSignal,
  systemPrompt: string = FLUX_SYSTEM_PROMPT,
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
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
        max_tokens: 4096,
      }, { signal });

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
    let finalSystemPrompt = FLUX_SYSTEM_PROMPT;
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

      if (chat.project_id) {
        try {
          const project = await admin.databases.getDocument(
            dbId,
            COLLECTIONS.PROJECTS,
            chat.project_id
          );
          if (project.instructions) {
            finalSystemPrompt = `${FLUX_SYSTEM_PROMPT}\n\nProject Instructions:\n${project.instructions}`;
            console.log("[API /chat] Applied project instructions");
          }
        } catch (err) {
          console.error("[API /chat] Failed to fetch project instructions:", err);
        }
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

    // Add current user message to context
    let userMessageContent = message;

    // Detect uploaded file links in message (pattern: 📎 filename: url)
    const fileMatches = userMessageContent.matchAll(/📎\s*([^:\n]+):\s*(https?:\/\/[^\s\n]+)/g);
    const detectedFiles: { name: string, url: string }[] = [];
    for (const match of fileMatches) {
      detectedFiles.push({ name: match[1].trim(), url: match[2].trim() });
    }

    if (detectedFiles.length > 0) {
      console.log(`[API /chat] Detected ${detectedFiles.length} uploaded files. Fetching content...`);
      let combinedFileContent = "";

      for (const file of detectedFiles) {
        try {
          // Extract fileId from the URL (URL looks like: .../files/{fileId}/view...)
          const urlParts = file.url.split("/");
          const fileId = urlParts[urlParts.length - 3]; // Third from end is fileId

          if (fileId) {
            console.log(`[API /chat] Fetching content for file ${file.name} (${fileId}) via Admin SDK`);
            const response = await admin.storage.getFileDownload(BUCKET_ID, fileId);
            const text = await response.text();
            combinedFileContent += `\n--- File: ${file.name} ---\n${text}\n`;
          } else {
            console.error(`[API /chat] Could not extract fileId from URL: ${file.url}`);
          }
        } catch (err) {
          console.error(`[API /chat] Error fetching file ${file.name}:`, err);
        }
      }

      userMessageContent = `Attached Files Content:\n${combinedFileContent}\n\nUser Message:\n${userMessageContent}`;
    }

    messages.push({ role: "user", content: userMessageContent });

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
      completion = await callAIWithRetry(nvidia, model, messages, request.signal, finalSystemPrompt);
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
        } catch (err: any) {
          if (err.name === "AbortError" || request.signal.aborted) {
            console.log("[API /chat] Stream aborted by client. Saving partial response...");
            if (fullContent) {
              try {
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
                console.log("[API /chat] Partial response saved.");
              } catch (dbErr) {
                console.error("[API /chat] Failed to save partial response:", dbErr);
              }
            }
            controller.close();
          } else {
            console.error("Stream error:", err);
            controller.error(err);
          }
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
