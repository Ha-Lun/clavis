import { createAIClient } from "@/lib/ai-client";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { modelId } = await req.json();

    if (!modelId) {
      return NextResponse.json({ error: "modelId is required" }, { status: 400 });
    }

    let apiModelId = modelId;
    if (modelId.startsWith("google/")) {
      apiModelId = modelId.replace("google/", "");
    }

    const aiClient = createAIClient(modelId);
    const timeoutMs = 15000;

    // Use a race to enforce a strict timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), timeoutMs),
    );

    const testPromise = aiClient.chat.completions.create({
      model: apiModelId,
      messages: [{ role: "user", content: "Reply with exactly 'ok'" }],
      max_tokens: 10,
    });

    try {
      await Promise.race([testPromise, timeoutPromise]);
      return NextResponse.json({ success: true });
    } catch (err: any) {
      console.error(`[API /api/models/test] Test failed for ${modelId}:`, err.message);
      return NextResponse.json({ 
        success: false, 
        error: err.message || "Model failed to respond" 
      });
    }
  } catch (err: any) {
    console.error("[API /api/models/test] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
