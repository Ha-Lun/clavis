import { createAdminClient } from "@/lib/appwrite/server";
import { createAIClient } from "@/lib/ai-client";
import { DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config";
import { CLAVIS_SYSTEM_PROMPT } from "@/lib/prompts";
import { NextRequest, NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { performWebSearch } from "@/lib/search";
import { routeModel } from "@/lib/modelRouter";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CLAVIS_API_TOKEN;

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let { message, chatId, model = "auto", webSearch = false } = await request.json();

    if (!message || !chatId) {
      return NextResponse.json({ error: "Missing message or chatId" }, { status: 400 });
    }

    const admin = await createAdminClient();
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

    let history: any = { documents: [] };
    try {
      history = await admin.databases.listDocuments(dbId, COLLECTIONS.MESSAGES, [
        Query.equal("chat_id", chatId),
        Query.orderAsc("$createdAt"),
        Query.limit(99),
      ]);
    } catch (e) {
      console.warn("Could not fetch chat history:", e);
    }

    try {
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
    } catch (e) {
      console.warn("Could not save user message:", e);
    }

    const messages = history.documents.map((m: any) => ({
      role: m.role as "system" | "user" | "assistant",
      content: m.content as string,
    }));

    messages.push({ role: "user", content: message });

    let finalModelId = model;
    if (!finalModelId || finalModelId === "auto") {
      finalModelId = routeModel(messages);
    }

    if (!process.env.NVIDIA_API_KEY && process.env.GROQ_API_KEY) {
      finalModelId = "openai/gpt-oss-120b";
    } else if (!process.env.NVIDIA_API_KEY && !finalModelId.startsWith("google/")) {
      finalModelId = "google/gemini-2.5-flash";
    }

    let apiModelId = finalModelId;
    if (finalModelId.startsWith("google/")) {
      apiModelId = finalModelId.replace("google/", "");
    }

    const aiClient = createAIClient(finalModelId);
    
    const webSearchTool = webSearch ? [
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

    let completion = await aiClient.chat.completions.create({
      model: apiModelId,
      messages: [
        { role: "system", content: CLAVIS_SYSTEM_PROMPT },
        ...messages,
      ] as any[],
      ...(webSearchTool ? { tools: webSearchTool } : {}),
      stream: false,
    });

    const responseMessage = (completion as any).choices?.[0]?.message;
    let responseContent = responseMessage?.content ?? "";

    if (responseMessage?.tool_calls?.length) {
      messages.push(responseMessage);
      
      for (const tc of responseMessage.tool_calls) {
        if (tc.function.name === "web_search" || tc.function.name === "search") {
          try {
            const args = JSON.parse(tc.function.arguments);
            const formattedResults = await performWebSearch(args.query);
            messages.push({
              role: "tool",
              tool_call_id: tc.id,
              content: `Search Results for "${args.query}":\n\n${formattedResults}`
            });
          } catch (err: any) {
            messages.push({
              role: "tool",
              tool_call_id: tc.id,
              content: `Error performing search: ${err.message}`
            });
          }
        }
      }

      const secondCompletion = await aiClient.chat.completions.create({
        model: apiModelId,
        messages: [
          { role: "system", content: CLAVIS_SYSTEM_PROMPT },
          ...messages,
        ] as any[],
        stream: false,
      });

      responseContent = (secondCompletion as any).choices?.[0]?.message?.content ?? "";
    }

    const responseWithAttribution = `${responseContent.trim()}\n\n---\n_Model: ${finalModelId}_`;

    try {
      await admin.databases.createDocument(
        dbId,
        COLLECTIONS.MESSAGES,
        ID.unique(),
        {
          chat_id: chatId,
          role: "assistant",
          content: responseContent + `\n\n<!-- model: ${finalModelId} -->`,
        }
      );
    } catch (e) {
      console.warn("Could not save assistant message:", e);
    }

    return NextResponse.json({ 
      response: responseWithAttribution,
      model: finalModelId
    });
  } catch (err: any) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
