export type ModelId =
  | "auto"
  | "mistralai/mistral-small-4-119b-2603"
  | "deepseek-ai/deepseek-v4-pro"
  | "qwen/qwen3.5-122b-a10b"
  | "minimaxai/minimax-m2.7"
  | "moonshotai/kimi-k2.6"
  | "nvidia/nemotron-3-nano-30b-a3b";

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
    id: "nvidia/nemotron-3-nano-30b-a3b",
    name: "Nemotron Nano",
    shortName: "Nemotron",
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
    id: "deepseek-ai/deepseek-v4-pro",
    name: "DeepSeek V4 Pro",
    shortName: "DS Pro",
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
