export type ModelId =
  | "deepseek-ai/deepseek-v4-flash"
  | "deepseek-ai/deepseek-v4-pro"
  | "z-ai/glm5.1"
  | "minimaxai/minimax-m2.7"
  | "moonshotai/kimi-k2-instruct"
  | "nvidia/nemotron-3-nano-30b-a3b";

export interface ModelInfo {
  id: ModelId;
  name: string;
  shortName: string;
}

export const MODELS: ModelInfo[] = [
  {
    id: "nvidia/nemotron-3-nano-30b-a3b",
    name: "Nemotron Nano",
    shortName: "Nemotron",
  },
  {
    id: "moonshotai/kimi-k2-instruct",
    name: "Kimi K2",
    shortName: "Kimi",
  },
  {
    id: "minimaxai/minimax-m2.7",
    name: "MiniMax M2.7",
    shortName: "MiniMax",
  },
  {
    id: "z-ai/glm5.1",
    name: "GLM 5.1",
    shortName: "GLM",
  },
  {
    id: "deepseek-ai/deepseek-v4-pro",
    name: "DeepSeek V4 Pro",
    shortName: "DS Pro",
  },
  {
    id: "deepseek-ai/deepseek-v4-flash",
    name: "DeepSeek V4 Flash",
    shortName: "DS Flash",
  },
];

export const DEFAULT_MODEL: ModelId = "nvidia/nemotron-3-nano-30b-a3b";

export function getModelInfo(modelId: string): ModelInfo {
  return (
    MODELS.find((m) => m.id === modelId) ?? {
      id: modelId as ModelId,
      name: modelId,
      shortName: modelId.split("/").pop() ?? modelId,
    }
  );
}
