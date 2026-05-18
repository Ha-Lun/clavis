import { createSessionClient } from "@/lib/appwrite/server";
import { councilWithProgress, COUNCIL_MODELS } from "@/lib/council";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // Validate auth and input before streaming
  const client = await createSessionClient();
  if (!client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await client.account.get();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let query: string;
  let models: string[] | undefined;

  try {
    const body = await request.json();
    query = body.query;
    models = body.models;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  if (query.length > 10000) {
    return NextResponse.json({ error: "Query too long (max 10,000 characters)" }, { status: 400 });
  }

  const validModelIds: string[] = COUNCIL_MODELS.map((m) => m.id);
  if (models) {
    if (!Array.isArray(models) || models.length < 2 || models.length > 5) {
      return NextResponse.json({ error: "Must provide 2-5 models" }, { status: 400 });
    }
    for (const m of models) {
      if (!validModelIds.includes(m)) {
        return NextResponse.json({ error: `Invalid model: ${m}` }, { status: 400 });
      }
    }
  }

  const selectedModels = models || COUNCIL_MODELS.slice(0, 3).map((m) => m.id);

  // Stream SSE events
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        await councilWithProgress(query.trim(), selectedModels, (event) => {
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        });
      } catch (err: any) {
        const data = `data: ${JSON.stringify({ type: "error", error: err.message || "Council failed" })}\n\n`;
        controller.enqueue(encoder.encode(data));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
