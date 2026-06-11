export type ModelId =
  | "auto"
  | "google/gemini-3.1-flash-lite"
  | "mistralai/mistral-small-4-119b-2603"
  | "mistralai/mistral-medium-3.5-128b"
  | "qwen/qwen3.5-122b-a10b"
  | "minimaxai/minimax-m2.7"
  | "moonshotai/kimi-k2.6"
  | "nvidia/nemotron-3-nano-30b-a3b"
  | "nvidia/nemotron-3-ultra-550b-a55b";

export interface ModelInfo {
  id: ModelId;
  name: string;
  shortName: string;
}

export const MODELS: ModelInfo[] = [
  {
    id: "auto",
    name: "Auto",
    shortName: "Auto",
  },
  {
    id: "google/gemini-3.1-flash-lite",
    name: "Gemini 3.1 Flash",
    shortName: "Gemini 3.1",
  },
  {
    id: "nvidia/nemotron-3-nano-30b-a3b",
    name: "Nemotron Nano Omni",
    shortName: "Nemotron Omni",
  },
  {
    id: "nvidia/nemotron-3-ultra-550b-a55b",
    name: "Nemotron Ultra",
    shortName: "Nemotron Ultra",
  },
  {
    id: "moonshotai/kimi-k2.6",
    name: "Kimi K2.6",
    shortName: "Kimi",
  },
  {
    id: "minimaxai/minimax-m2.7",
    name: "MiniMax M2.7",
    shortName: "MiniMax",
  },
  {
    id: "qwen/qwen3.5-122b-a10b",
    name: "Qwen 3.5",
    shortName: "Qwen",
  },
  {
    id: "mistralai/mistral-medium-3.5-128b",
    name: "Mistral Medium 3.5",
    shortName: "Mistral Med",
  },
  {
    id: "mistralai/mistral-small-4-119b-2603",
    name: "Mistral Small 4",
    shortName: "Mistral",
  },
];

export const DEFAULT_MODEL: ModelId = "auto";

export function getModelInfo(modelId: string): ModelInfo {
  return (
    MODELS.find((m) => m.id === modelId) ?? {
      id: modelId as ModelId,
      name: modelId,
      shortName: modelId.split("/").pop() ?? modelId,
    }
  );
}
