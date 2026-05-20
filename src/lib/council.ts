import { createNvidiaClient } from "@/lib/nvidia";
import { getModelInfo } from "@/lib/models";

// ─── Types ────────────────────────────────────────

export interface CouncilModelResponse {
  model: string;
  modelName: string;
  response: string | null;
  error: string | null;
  latencyMs: number;
}

export interface DisagreementPosition {
  model: string;
  view: string;
}

export interface Disagreement {
  topic: string;
  positions: DisagreementPosition[];
}

export interface CouncilSynthesis {
  summary: string;
  consensus: string;
  disagreements: Disagreement[];
  confidence: "high" | "medium" | "low";
}

export interface CouncilResult {
  synthesis: CouncilSynthesis;
  modelResponses: CouncilModelResponse[];
  totalLatencyMs: number;
}

// Progress event types for SSE streaming
export type CouncilProgressEvent =
  | { type: "model_querying"; model: string; modelName: string; index: number; total: number }
  | { type: "model_complete"; model: string; modelName: string; index: number; total: number; latencyMs: number }
  | { type: "model_error"; model: string; modelName: string; index: number; total: number; error: string; latencyMs: number }
  | { type: "synthesizing" }
  | { type: "result"; data: CouncilResult }
  | { type: "error"; error: string };

// ─── Constants ────────────────────────────────────

export const SYNTHESIZER_MODEL = "moonshotai/kimi-k2.6";

export const COUNCIL_MODELS = [
  { id: "nvidia/nemotron-3-nano-30b-a3b", name: "Nemotron Nano" },
  { id: "mistralai/mistral-small-4-119b-2603", name: "Mistral Small 4" },
  { id: "minimaxai/minimax-m2.7", name: "MiniMax M2.7" },
  { id: "qwen/qwen3.5-122b-a10b", name: "Qwen 3.5" },
  { id: "deepseek-ai/deepseek-v4-pro", name: "DeepSeek V4 Pro" },
] as const;

export const DEFAULT_COUNCIL_MODELS = COUNCIL_MODELS.slice(0, 3).map((m) => m.id);

// ─── Synthesizer Prompt ───────────────────────────

function buildSynthesizerPrompt(query: string, responses: CouncilModelResponse[]): string {
  const modelBlocks = responses
    .filter((r) => r.response !== null)
    .map((r) => `[Model: ${r.model}]\n${r.response}`)
    .join("\n\n");

  const failedModels = responses.filter((r) => r.error !== null);
  const failedBlock = failedModels.length > 0
    ? `\n\nNote: The following models failed and their responses are unavailable:\n${failedModels.map((r) => `- ${r.model}: ${r.error}`).join("\n")}`
    : "";

  return `You are a synthesis engine. Multiple AI models were asked the same question. Your job is to analyze their responses and produce a structured comparison.

User's original question:
${query}

Model responses:
${modelBlocks}${failedBlock}

Analyze the above responses and return ONLY a valid JSON object with this exact shape (no markdown fences, no preamble, no explanation — raw JSON only):

{
  "summary": "2-3 sentence overview of what the models collectively say",
  "consensus": "Points all/most models agreed on as a coherent paragraph",
  "disagreements": [
    {
      "topic": "Short label for the disagreement",
      "positions": [
        { "model": "model-id", "view": "One sentence summary of its stance" }
      ]
    }
  ],
  "confidence": "high | medium | low"
}

Confidence rules:
- "high" if all models agree on the core answer
- "medium" if minor divergences or different emphasis
- "low" if contradictions on key points

Keep all fields highly concise, focused, and free of decorative text to ensure maximum synthesis speed. Return ONLY the JSON. No other text.`;
}

// ─── Core Functions ───────────────────────────────

async function queryModel(
  nvidia: ReturnType<typeof createNvidiaClient>,
  model: string,
  query: string,
): Promise<CouncilModelResponse> {
  const modelName = getModelInfo(model).name;
  const startMs = Date.now();

  try {
    const completion = await Promise.race([
      nvidia.chat.completions.create({
        model,
        messages: [
          { role: "system", content: "You are a knowledgeable AI assistant. Answer the user's question directly, clearly, and concisely. Keep responses under 300 words without conversational filler or introductory preamble." },
          { role: "user", content: query },
        ],
        stream: false,
        max_tokens: 1024,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out after 60s")), 60000)
      ),
    ]);

    const latencyMs = Date.now() - startMs;
    const content = (completion as any).choices?.[0]?.message?.content ?? "";

    return { model, modelName, response: content, error: null, latencyMs };
  } catch (err: any) {
    const latencyMs = Date.now() - startMs;
    return { model, modelName, response: null, error: err.message || "Unknown error", latencyMs };
  }
}

function parseSynthesis(raw: string): CouncilSynthesis {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    return {
      summary: "The synthesizer returned a non-JSON response. Raw output is included below.",
      consensus: cleaned,
      disagreements: [],
      confidence: "low",
    };
  }
}

/**
 * Run council with progress callbacks for SSE streaming.
 * Models are queried in parallel, but progress events fire as each completes.
 */
export async function councilWithProgress(
  query: string,
  models: string[],
  onProgress: (event: CouncilProgressEvent) => void,
): Promise<void> {
  const totalStart = Date.now();
  const nvidia = createNvidiaClient();
  const total = models.length;

  // Emit querying events for all models
  models.forEach((model, index) => {
    const modelName = getModelInfo(model).name;
    onProgress({ type: "model_querying", model, modelName, index, total });
  });

  // Fire all queries in parallel, emit progress as each resolves
  const modelResponses: CouncilModelResponse[] = [];
  let completedCount = 0;

  await Promise.all(
    models.map(async (model, index) => {
      const result = await queryModel(nvidia, model, query);
      modelResponses[index] = result;
      completedCount++;

      if (result.error) {
        onProgress({
          type: "model_error",
          model: result.model,
          modelName: result.modelName,
          index,
          total,
          error: result.error,
          latencyMs: result.latencyMs,
        });
      } else {
        onProgress({
          type: "model_complete",
          model: result.model,
          modelName: result.modelName,
          index,
          total,
          latencyMs: result.latencyMs,
        });
      }
    })
  );

  const successfulResponses = modelResponses.filter((r) => r.response !== null);
  if (successfulResponses.length === 0) {
    onProgress({ type: "error", error: "All models failed. Cannot synthesize." });
    return;
  }

  // Synthesize
  onProgress({ type: "synthesizing" });

  const synthesizerPrompt = buildSynthesizerPrompt(query, modelResponses);
  const synthCompletion = await Promise.race([
    nvidia.chat.completions.create({
      model: SYNTHESIZER_MODEL,
      messages: [{ role: "user", content: synthesizerPrompt }],
      stream: false,
      max_tokens: 2048,
    }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Synthesizer timed out after 90s")), 90000)
    ),
  ]);

  const rawSynthesis = (synthCompletion as any).choices?.[0]?.message?.content ?? "";
  const synthesis = parseSynthesis(rawSynthesis);
  const totalLatencyMs = Date.now() - totalStart;

  onProgress({
    type: "result",
    data: { synthesis, modelResponses, totalLatencyMs },
  });
}
