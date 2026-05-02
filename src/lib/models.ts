export type ModelId =
  | "deepseek-ai/deepseek-v4-flash"
  | "deepseek-ai/deepseek-v4-pro"
  | "z-ai/glm-5.1"
  | "minimaxai/minimax-m2.7"
  | "moonshotai/kimi-k2.6"
  | "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning";

export interface ModelInfo {
  id: ModelId;
  name: string;
  shortName: string;
}

export const MODELS: ModelInfo[] = [
  {
    id: "deepseek-ai/deepseek-v4-flash",
    name: "DeepSeek V4 Flash",
    shortName: "DS Flash",
  },
  {
    id: "deepseek-ai/deepseek-v4-pro",
    name: "DeepSeek V4 Pro",
    shortName: "DS Pro",
  },
  {
    id: "z-ai/glm-5.1",
    name: "GLM 5.1",
    shortName: "GLM",
  },
  {
    id: "minimaxai/minimax-m2.7",
    name: "MiniMax M2.7",
    shortName: "MiniMax",
  },
  {
    id: "moonshotai/kimi-k2.6",
    name: "Kimi K2.6",
    shortName: "Kimi",
  },
  {
    id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
    name: "Nemotron Nano Omni",
    shortName: "Nemotron",
  },
];

export const DEFAULT_MODEL: ModelId = "deepseek-ai/deepseek-v4-flash";

export function getModelInfo(modelId: string): ModelInfo {
  return (
    MODELS.find((m) => m.id === modelId) ?? {
      id: modelId as ModelId,
      name: modelId,
      shortName: modelId.split("/").pop() ?? modelId,
    }
  );
}
