import OpenAI from "openai";
import { createAdminClient } from "@/lib/appwrite/server";
import { createAIClient } from "@/lib/ai-client";
import { DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config";
import { CLAVIS_SYSTEM_PROMPT, CLAVIS_CLI_SYSTEM_PROMPT } from "@/lib/prompts";
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

    let { message, chatId, model = "auto", webSearch = false, client = "web" } = await request.json();
    const isCli = client === "cli";
    const systemPrompt = isCli ? CLAVIS_CLI_SYSTEM_PROMPT : CLAVIS_SYSTEM_PROMPT;

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
    } else if (!process.env.NVIDIA_API_KEY) {
      finalModelId = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning";
    }

    const apiModelId = finalModelId;

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

    let responseContent = "";
    try {
      let completion = await aiClient.chat.completions.create({
        model: apiModelId,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ] as any[],
        ...(webSearchTool ? { tools: webSearchTool } : {}),
        stream: false,
      });

      const responseMessage = (completion as any).choices?.[0]?.message;
      responseContent = responseMessage?.content ?? "";

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
            { role: "system", content: systemPrompt },
            ...messages,
          ] as any[],
          stream: false,
        });

        responseContent = (secondCompletion as any).choices?.[0]?.message?.content ?? "";
      }
    } catch (aiErr: any) {
      const isOverload =
        aiErr?.status === 503 ||
        aiErr?.status === 429 ||
        aiErr?.code === 503 ||
        aiErr?.code === 429 ||
        String(aiErr?.message || "").includes("ResourceExhausted") ||
        String(aiErr?.message || "").includes("limit reached");

      if (isOverload && process.env.GROQ_API_KEY) {
        console.warn("NVIDIA NIM 503/ResourceExhausted, falling back to Groq llama-3.3-70b-versatile...");
        try {
          const fallbackClient = new OpenAI({
            apiKey: process.env.GROQ_API_KEY,
            baseURL: "https://api.groq.com/openai/v1",
            timeout: 90 * 1000,
            maxRetries: 1,
          });

          const fallbackCompletion = await fallbackClient.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: systemPrompt },
              ...messages,
            ] as any[],
            stream: false,
          });

          responseContent = (fallbackCompletion as any).choices?.[0]?.message?.content ?? "";
          finalModelId = "llama-3.3-70b-versatile";
        } catch (groqErr: any) {
          console.error("Groq fallback also failed:", groqErr);
          return NextResponse.json({
            response: "[Notice] The selected model is temporarily congested on NVIDIA's cloud servers. Please switch models with /model (e.g. model 2 or 4) and try again."
          }, { status: 200 });
        }
      } else {
        console.error("AI completion error:", aiErr);
        return NextResponse.json({
          response: "[Notice] The selected model is temporarily congested on NVIDIA's cloud servers. Please switch models with /model (e.g. model 2 or 4) and try again."
        }, { status: 200 });
      }
    }

    const responseWithAttribution = isCli
      ? responseContent.trim()
      : `${responseContent.trim()}\n\n---\n_Model: ${finalModelId}_`;

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
