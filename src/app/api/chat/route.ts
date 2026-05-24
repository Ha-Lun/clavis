import { createSessionClient, createAdminClient } from "@/lib/appwrite/server";
import { createNvidiaClient } from "@/lib/nvidia";
import { DATABASE_ID, COLLECTIONS, BUCKET_ID } from "@/lib/appwrite/config";
import { CLAVIS_SYSTEM_PROMPT } from "@/lib/prompts";
import { NextRequest } from "next/server";
import { ID, Query } from "node-appwrite";
import { routeModel } from "@/lib/modelRouter";
import { Chat, Project, FileRecord, Message } from "@/lib/appwrite/types";
import type {
  ChatCompletion,
  ChatCompletionChunk,
} from "openai/resources/index.mjs";

export const dynamic = "force-dynamic";

type MessageParam = { 
  role: "system" | "user" | "assistant" | "tool"; 
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
};

async function callAIWithRetry(
  nvidia: ReturnType<typeof createNvidiaClient>,
  model: string,
  messages: MessageParam[],
  signal: AbortSignal,
  systemPrompt: string = CLAVIS_SYSTEM_PROMPT,
  maxRetries: number = 2,
  timeoutMs: number = 30000,
  onRetry?: (attempt: number) => void,
  enableWebSearch: boolean = true,
) {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[API /chat] AI attempt ${attempt + 1}/${maxRetries + 1}...`);

      // Create promise with timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out")), timeoutMs),
      );

      const webSearchTool = enableWebSearch ? [
          {
            type: "function" as const,
            function: {
              name: "web_search",
              description: "Search the web for current, up-to-date information",
              parameters: {
                type: "object",
                properties: {
                  query: { type: "string", description: "The search query" }
                },
                required: ["query"]
              }
            }
          }
        ] : undefined;

      const aiPromise = nvidia.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ] as any[],
        ...(webSearchTool ? { tools: webSearchTool } : {}),
        stream: true,
        max_tokens: model.includes("qwen3.5") ? 16384 : 8192,
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
          onRetry?.(attempt + 2);
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
        onRetry?.(attempt + 2);
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

    const { chatId, message, model, webSearch } = await request.json();
    const enableWebSearch = webSearch !== false; // Default to true
    console.log("[API /chat] Request:", {
      chatId: chatId?.slice(0, 20),
      message: message?.slice(0, 30),
      model,
      webSearch: enableWebSearch,
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

    // Parallel fetch user, chat, and history to minimize initial latency
    const [user, chat, historyResult] = await Promise.all([
      client.account.get(),
      admin.databases.getDocument(dbId, COLLECTIONS.CHATS, chatId) as Promise<Chat>,
      admin.databases.listDocuments(dbId, COLLECTIONS.MESSAGES, [
        Query.equal("chat_id", chatId),
        Query.orderAsc("$createdAt"),
        Query.limit(99),
      ]),
    ]);

    console.log("[API /chat] User:", user.email);

    if (chat.user_id !== user.$id) {
      console.log("[API /chat] Chat not owned by user - 404");
      return new Response(JSON.stringify({ error: "Chat not found" }), {
        status: 404,
      });
    }

    // Save user message in the background - don't block the AI stream
    const saveUserMsgPromise = admin.databases.createDocument(
      dbId,
      COLLECTIONS.MESSAGES,
      ID.unique(),
      {
        chat_id: chatId,
        role: "user",
        content: message,
      },
    ).then(() => console.log("[API /chat] User message saved to DB"));

    // Verify chat belongs to user
    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    let finalSystemPrompt = enableWebSearch
      ? `Today's date is ${currentDate}. You have access to a web_search tool — use it whenever the user's query requires recent or time-sensitive information.\n\n${CLAVIS_SYSTEM_PROMPT}`
      : `Today's date is ${currentDate}.\n\n${CLAVIS_SYSTEM_PROMPT}`;
    try {
      if (chat.project_id) {
        try {
          const project = await admin.databases.getDocument(
            dbId,
            COLLECTIONS.PROJECTS,
            chat.project_id
          ) as unknown as Project;
          if (project.instructions) {
            finalSystemPrompt += `\n\nProject Instructions:\n${project.instructions}`;
            console.log("[API /chat] Applied project instructions");
          }
        } catch (err) {
          console.error("[API /chat] Failed to fetch project instructions:", err);
        }
      }

      // Fetch all relevant files for context (project level + chat level)
      try {
        console.log(`[API /chat] Fetching context files for chat: ${chatId}, project: ${chat.project_id}`);

        let allFiles: FileRecord[] = [];
        if (chat.project_id) {
          const [chatFiles, projectFiles] = await Promise.all([
            admin.databases.listDocuments(dbId, COLLECTIONS.FILES, [Query.equal("chat_id", chatId)]),
            admin.databases.listDocuments(dbId, COLLECTIONS.FILES, [Query.equal("project_id", chat.project_id)])
          ]);
          console.log(`[API /chat] Found ${chatFiles.documents.length} chat files and ${projectFiles.documents.length} project files`);
          allFiles = [...(chatFiles.documents as unknown as FileRecord[]), ...(projectFiles.documents as unknown as FileRecord[])];
        } else {
          const chatFiles = await admin.databases.listDocuments(dbId, COLLECTIONS.FILES, [Query.equal("chat_id", chatId)]);
          console.log(`[API /chat] Found ${chatFiles.documents.length} chat files`);
          allFiles = chatFiles.documents as unknown as FileRecord[];
        }

        if (allFiles.length > 0) {
          // Deduplicate by $id
          const uniqueFiles = Array.from(new Map(allFiles.map(f => [f.$id, f])).values());
          const fileNames = uniqueFiles.map(f => f.name).join(", ");

          let filesContext = `The following files are available in this project context: ${fileNames}\n\n`;

          const filesWithContent = uniqueFiles.filter(f => f.content);
          console.log(`[API /chat] Total unique files: ${uniqueFiles.length}, files with readable content: ${filesWithContent.length}`);

          if (filesWithContent.length > 0) {
            const contentBlocks = filesWithContent
              .map(f => `--- START FILE: ${f.name} ---\n${f.content}\n--- END FILE: ${f.name} ---`)
              .join("\n\n");

            // Apply context volume cap (50k chars) to prevent TTFT spikes
            const MAX_CONTEXT_CHARS = 50000;
            if (contentBlocks.length > MAX_CONTEXT_CHARS) {
              filesContext += `File Contents (Truncated to ${MAX_CONTEXT_CHARS} chars):\n${contentBlocks.slice(0, MAX_CONTEXT_CHARS)}\n\n[Context truncated due to size limit]`;
            } else {
              filesContext += `File Contents:\n${contentBlocks}`;
            }
          } else {
            filesContext += "Note: No readable text content was extracted from these files yet.";
          }

          finalSystemPrompt += `\n\nProject/Chat Files Context:\n${filesContext}`;
          console.log(`[API /chat] Applied context from ${uniqueFiles.length} files. Prompt length: ${finalSystemPrompt.length}`);
        }
      } catch (err) {
        console.error("[API /chat] Failed to fetch files for context:", err);
      }
    } catch (err) {
      console.log("[API /chat] Context fetch error:", err);
    }

    // Build message list from history (which was fetched in parallel at the start)
    const messages: MessageParam[] = (historyResult.documents as unknown as Message[]).map((m) => ({
      role: m.role as "system" | "user" | "assistant" | "tool",
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
          const fileId = urlParts[urlParts.length - 2]; // Second from end is fileId

          if (fileId) {
            console.log(`[API /chat] Fetching content for file ${file.name} (${fileId}) via Admin SDK`);
            
            let text = "";
            let fetchedFromDb = false;

            // First, try to get it from the database where it was extracted during upload
            try {
              const fileRecordsResult = await admin.databases.listDocuments(dbId, COLLECTIONS.FILES, [
                Query.equal("file_id", fileId),
                Query.limit(1)
              ]);
              const fileDocs = fileRecordsResult.documents as unknown as FileRecord[];
              if (fileDocs.length > 0 && fileDocs[0].content) {
                text = fileDocs[0].content;
                fetchedFromDb = true;
                console.log(`[API /chat] Successfully retrieved content from DB for ${file.name}`);
              }
            } catch (dbErr) {
              console.error(`[API /chat] Failed to fetch file content from DB:`, dbErr);
            }

            // Fallback: download and parse it on the fly
            if (!fetchedFromDb) {
              console.log(`[API /chat] Content not in DB, downloading and parsing on the fly...`);
              const arrayBuffer = await admin.storage.getFileDownload(BUCKET_ID, fileId);
              const buffer = Buffer.from(arrayBuffer);
              
              if (file.name.toLowerCase().endsWith(".pdf")) {
                console.log(`[API /chat] Parsing PDF content for ${file.name}`);
                try {
                  const pdfParseModule: any = await import('pdf-parse');
                  const PDFParseClass = pdfParseModule.PDFParse || (pdfParseModule.default && pdfParseModule.default.PDFParse);
                  if (!PDFParseClass) throw new Error("Could not find PDFParse constructor in module");
                  
                  const parser = new PDFParseClass({ data: buffer });
                  const data = await parser.getText();
                  text = data.text;
                } catch (parseErr: any) {
                  console.error(`[API /chat] PDFParse Error:`, parseErr);
                  text = `[Error parsing PDF: ${parseErr.message}]`;
                }
              } else {
                text = buffer.toString('utf-8');
              }
            }
            
            combinedFileContent += `\n--- File: ${file.name} ---\n${text}\n`;
          } else {
            console.error(`[API /chat] Could not extract fileId from URL: ${file.url}`);
          }
        } catch (err) {
          console.error(`[API /chat] Error fetching file ${file.name}:`, err);
        }
      }

      userMessageContent = `<system_instruction>
The user has attached files to this message. Their extracted text content is provided below in the <attached_files> block. 
Do NOT attempt to fetch or download the URLs in the user's message. You already have the full text.
</system_instruction>

<attached_files>
${combinedFileContent}
</attached_files>

User Message:
${userMessageContent}`;
    }

    messages.push({ role: "user", content: userMessageContent });

    console.log(
      "[API /chat] Messages for AI:",
      messages.length,
      "(history + current)",
    );

    // Call NVIDIA NIM with retry
    console.log("[API /chat] Creating NVIDIA client, model:", model);

    let finalModelId = model;
    if (model === "auto") {
      finalModelId = routeModel(messages);
      console.log(`[API /chat] Auto-routed to model: ${finalModelId}`);
    }

    let nvidia: ReturnType<typeof createNvidiaClient>;
    try {
      nvidia = createNvidiaClient();
    } catch (err: any) {
      console.error("[API /chat] NVIDIA client error:", err.message);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
      });
    }

    // Stream response
    let fullContent = "";
    let chunkCount = 0;

    const stream = new ReadableStream({
      async start(controller) {
        async function processStream(currentCompletion: any) {
          try {
            console.log("[API /chat] Starting stream process...");
            const streamingCompletion = currentCompletion as AsyncIterable<ChatCompletionChunk>;
            
            let toolCalls: any[] = [];
            let isThinking = false;

            for await (const chunk of streamingCompletion) {
              const delta = chunk.choices[0]?.delta;
              
              if (delta?.tool_calls && delta.tool_calls.length > 0) {
                for (const toolCall of delta.tool_calls) {
                  const index = toolCall.index;
                  if (!toolCalls[index]) {
                    toolCalls[index] = {
                      id: toolCall.id,
                      type: toolCall.type,
                      function: { name: toolCall.function?.name || "", arguments: "" }
                    };
                  }
                  if (toolCall.function?.arguments) {
                    toolCalls[index].function.arguments += toolCall.function.arguments;
                  }
                }
                continue;
              }

              // Handle Reasoning Content (Chain of Thought)
              const reasoningContent = (delta as any)?.reasoning_content ?? (delta as any)?.thought ?? "";
              if (reasoningContent) {
                if (!isThinking) {
                  isThinking = true;
                  const startTag = "<think>\n";
                  fullContent += startTag;
                  controller.enqueue(new TextEncoder().encode(startTag));
                }
                fullContent += reasoningContent;
                controller.enqueue(new TextEncoder().encode(reasoningContent));
              }

              const content = delta?.content ?? "";
              if (content) {
                if (isThinking) {
                  isThinking = false;
                  const endTag = "\n</think>\n\n";
                  fullContent += endTag;
                  controller.enqueue(new TextEncoder().encode(endTag));
                }
                chunkCount++;
                fullContent += content;
                controller.enqueue(new TextEncoder().encode(content));
              }
            }
            
            // If thinking finished but stream ended without content
            if (isThinking) {
              const endTag = "\n</think>\n\n";
              fullContent += endTag;
              controller.enqueue(new TextEncoder().encode(endTag));
              isThinking = false;
            }

            // Stream finished for this chunk. Check if there were tool calls.
            if (toolCalls.length > 0) {
              console.log("[API /chat] Tool calls detected:", JSON.stringify(toolCalls));
              
              messages.push({
                role: "assistant",
                content: "",
                tool_calls: toolCalls
              });

              for (const tc of toolCalls) {
                if (tc.function.name === "web_search") {
                  try {
                    const args = JSON.parse(tc.function.arguments);
                    console.log("[API /chat] Executing web_search for:", args.query);
                    
                    const searchRes = await fetch("https://api.tavily.com/search", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${process.env.TAVILY_API_KEY || ""}`
                      },
                      body: JSON.stringify({
                        query: args.query,
                        search_depth: "basic",
                        max_results: 5
                      })
                    });
                    
                    if (!searchRes.ok) throw new Error(`Search API failed with status ${searchRes.status}`);
                    const searchData = await searchRes.json();
                    
                    const formattedResults = searchData.results
                      .map((r: any) => `Source: ${r.url}\nTitle: ${r.title}\nContent: ${r.content}`)
                      .join("\n\n");
                      
                    messages.push({
                      role: "tool",
                      tool_call_id: tc.id,
                      content: `Search Results for "${args.query}":\n\n${formattedResults}`
                    });
                    
                  } catch (err: any) {
                    console.error("[API /chat] Tool execution failed:", err);
                    messages.push({
                      role: "tool",
                      tool_call_id: tc.id,
                      content: `Error performing search: ${err.message}`
                    });
                  }
                }
              }

              console.log("[API /chat] Calling AI again with tool results...");
              const nextCompletion = await callAIWithRetry(
                nvidia, 
                finalModelId, 
                messages, 
                request.signal, 
                finalSystemPrompt,
                2,
                30000,
                (attempt) => {
                  const retryMsg = `\n_This is taking longer than usual, trying again (attempt ${attempt})..._\n\n`;
                  fullContent += retryMsg;
                  controller.enqueue(new TextEncoder().encode(retryMsg));
                },
                enableWebSearch,
              );
              await processStream(nextCompletion);
              return;
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
                content: fullContent + `\n\n<!-- model: ${finalModelId} -->`,
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
                      content: fullContent + `\n\n<!-- model: ${finalModelId} -->`,
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
              const errorMessage = `\n\n❌ Error: ${err.message || "Failed to process stream"}`;
              fullContent += errorMessage;
              controller.enqueue(new TextEncoder().encode(errorMessage));
              
              // Save what we have
              if (fullContent) {
                try {
                  await admin.databases.createDocument(
                    dbId,
                    COLLECTIONS.MESSAGES,
                    ID.unique(),
                    {
                      chat_id: chatId,
                      role: "assistant",
                      content: fullContent + `\n\n<!-- model: ${finalModelId} -->`,
                    },
                  );
                } catch (dbErr) {
                  console.error("[API /chat] Failed to save error response:", dbErr);
                }
              }
              controller.close();
            }
          }
        }

        try {
          console.log("[API /chat] Calling NVIDIA API with retry...");
          const completion = await callAIWithRetry(
            nvidia, 
            finalModelId, 
            messages, 
            request.signal, 
            finalSystemPrompt,
            2,
            30000,
            (attempt) => {
              const retryMsg = `\n_This is taking longer than usual, trying again (attempt ${attempt})..._\n\n`;
              fullContent += retryMsg;
              controller.enqueue(new TextEncoder().encode(retryMsg));
            },
            enableWebSearch,
          );
          await processStream(completion);
        } catch (err: any) {
          console.error("[API /chat] NVIDIA API error after retries:", err.message);
          
          let errorText = "";
          if (err.status === 429 || err.message?.includes("busy")) {
            errorText = "Model is busy. Please try again in a moment.";
          } else {
            const errorMessage = err.message || "Failed to communicate with AI provider";
            errorText = errorMessage.toLowerCase().includes("timeout")
              ? "The request timed out. Please try again."
              : `AI Error: ${errorMessage}`;
          }
          
          const finalErrorMsg = `\n\n❌ ${errorText}`;
          fullContent += finalErrorMsg;
          controller.enqueue(new TextEncoder().encode(finalErrorMsg));
          
          // Save error message to DB
          try {
            await admin.databases.createDocument(
              dbId,
              COLLECTIONS.MESSAGES,
              ID.unique(),
              {
                chat_id: chatId,
                role: "assistant",
                content: fullContent + `\n\n<!-- model: ${finalModelId} -->`,
              },
            );
          } catch (dbErr) {
            console.error("[API /chat] Failed to save final error response:", dbErr);
          }
          
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "X-Resolved-Model": finalModelId,
      },
    });
  } catch (err) {
    console.error("Chat API error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
