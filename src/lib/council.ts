import { createAIClient } from "@/lib/ai-client";
import { getModelInfo } from "@/lib/models";
import { performWebSearch } from "@/lib/search";

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
  synthesizedPrompt: string;
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
  | { type: "web_searching" }
  | { type: "web_search_complete"; resultCount: number }
  | { type: "model_querying"; model: string; modelName: string; index: number; total: number }
  | { type: "model_complete"; model: string; modelName: string; index: number; total: number; latencyMs: number }
  | { type: "model_error"; model: string; modelName: string; index: number; total: number; error: string; latencyMs: number }
  | { type: "synthesizing" }
  | { type: "result"; data: CouncilResult }
  | { type: "error"; error: string };

// ─── Constants ────────────────────────────────────

export const SYNTHESIZER_MODEL = "google/gemini-3.1-flash-lite";

export const COUNCIL_MODELS = [
  { id: "meta/muse-glimmer-30b", name: "Muse Glimmer 30B" },
  { id: "poolside/laguna-xs-2", name: "Laguna XS 2" },
  { id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning", name: "Nemotron 3 Nano Omni Reasoning" },
  { id: "nvidia/nemotron-3-super-120b-a12b", name: "Nemotron 3 Super 120B" },
  { id: "nvidia/nemotron-3.5-lightning-30b-a3b", name: "Nemotron 3.5 Lightning" },
  { id: "nvidia/nemotron-3-ultra-550b-a55b", name: "Nemotron Ultra" },
] as const;

export const COUNCIL_AVAILABLE_MODELS = COUNCIL_MODELS;

export const DEFAULT_COUNCIL_MODELS = [
  "meta/muse-glimmer-30b",
  "nvidia/nemotron-3.5-lightning-30b-a3b",
  "poolside/laguna-xs-2",
];

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

  return `You are a synthesis engine. Multiple AI models were asked the same question. Your job is to analyze their responses and produce a structured comparison AND a single "Golden Response" (Synthesized Prompt) that represents the highest accuracy, best writing, and most useful parts of all responses combined.

User's original question:
${query}

Model responses:
${modelBlocks}${failedBlock}

Analyze the above responses and return ONLY a valid JSON object with this exact shape. Do not wrap the JSON in markdown formatting. Your response MUST start with { and end with }.

{
  "synthesizedPrompt": "The single most accurate, helpful, and well-written synthesis of all provided answers.",
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
- "high" if all models agree on the core answer and facts
- "medium" if minor divergences or different emphasis
- "low" if contradictions on key points or many model failures

The synthesizedPrompt should be cohesive, direct, and authoritative. Return ONLY raw JSON.`;
}

// ─── Core Functions ───────────────────────────────

async function queryModel(
  model: string,
  query: string,
): Promise<CouncilModelResponse> {
  const modelName = getModelInfo(model).name;
  const startMs = Date.now();

  try {
    const client = createAIClient(model);
    const apiModelId = model.startsWith("google/") ? model.replace("google/", "") : model;

    const completion = await Promise.race([
      client.chat.completions.create({
        model: apiModelId,
        messages: [
          { role: "system", content: "You are a knowledgeable AI assistant. Answer the user's question directly, clearly, and concisely. If web search results are provided, use them as your primary source of information and cite sources where relevant. Keep responses under 300 words without conversational filler or introductory preamble." },
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

  // 1. Try to extract JSON from markdown code block if present
  const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    cleaned = jsonMatch[1].trim();
  } else {
    // 2. Fallback: try to find the first { and last }
    const startIdx = cleaned.indexOf('{');
    const endIdx = cleaned.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      cleaned = cleaned.substring(startIdx, endIdx + 1);
    }
  }

  try {
    const parsed = JSON.parse(cleaned);
    return {
      synthesizedPrompt: parsed.synthesizedPrompt || parsed.consensus || parsed.summary || "Synthesis unavailable",
      summary: parsed.summary || "Summary unavailable",
      consensus: parsed.consensus || "Consensus unavailable",
      disagreements: Array.isArray(parsed.disagreements) ? parsed.disagreements : [],
      confidence: ["high", "medium", "low"].includes(parsed.confidence) ? parsed.confidence : "medium"
    };
  } catch (err) {
    console.error("[Council] Failed to parse synthesis JSON. Raw string:", raw);
    return {
      synthesizedPrompt: "Failed to synthesize a coherent response. The model did not return valid JSON data.",
      summary: "Parsing failed.",
      consensus: "Parsing failed.",
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
  const total = models.length;

  // Always perform web search to enrich council queries
  let enrichedQuery = query;
  onProgress({ type: "web_searching" });

  try {
    console.log("[Council] Performing web search for:", query.slice(0, 80));
    const formattedResults = await performWebSearch(query);

    if (formattedResults) {
      enrichedQuery = `Query: ${query}\n\n<web_search_results>\n${formattedResults}\n</web_search_results>\n\nPlease answer the query using the provided web search results for up-to-date context. Cite sources where relevant.`;
      const resultCount = (formattedResults.match(/Source:/g) || []).length;
      console.log(`[Council] Web search returned ${resultCount} results`);
      onProgress({ type: "web_search_complete", resultCount });
    } else {
      console.error(`[Council] Web search returned no results`);
      onProgress({ type: "web_search_complete", resultCount: 0 });
    }
  } catch (err) {
    console.error("[Council] Web search failed:", err);
    onProgress({ type: "web_search_complete", resultCount: 0 });
  }

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
      const result = await queryModel(model, enrichedQuery);
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
  const synthClient = createAIClient(SYNTHESIZER_MODEL);
  const synthApiModelId = SYNTHESIZER_MODEL.startsWith("google/") ? SYNTHESIZER_MODEL.replace("google/", "") : SYNTHESIZER_MODEL;
  
  const synthCompletion = await Promise.race([
    synthClient.chat.completions.create({
      model: synthApiModelId,
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
