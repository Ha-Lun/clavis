export type ModelId =
  | "auto"
  | "google/gemini-3.1-flash-lite"
  | "meta/muse-glimmer-30b"
  | "thinkingmachines/inkling"
  | "z-ai/glm-5.2"
  | "stepfun-ai/step-3.7-flash"
  | "nvidia/nemotron-3.5-lightning-30b-a3b"
  | "minimaxai/minimax-m3"
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
    id: "nvidia/nemotron-3.5-lightning-30b-a3b",
    name: "Nemotron 3.5 Lightning",
    shortName: "Nemotron Lightning",
  },
  {
    id: "nvidia/nemotron-3-ultra-550b-a55b",
    name: "Nemotron Ultra",
    shortName: "Nemotron Ultra",
  },
  {
    id: "meta/muse-glimmer-30b",
    name: "Muse Glimmer 30B",
    shortName: "Muse Glimmer",
  },
  {
    id: "minimaxai/minimax-m3",
    name: "MiniMax M3",
    shortName: "MiniMax",
  },
  {
    id: "thinkingmachines/inkling",
    name: "Inkling",
    shortName: "Inkling",
  },
  {
    id: "z-ai/glm-5.2",
    name: "GLM 5.2",
    shortName: "GLM 5.2",
  },
  {
    id: "stepfun-ai/step-3.7-flash",
    name: "Step 3.7 Flash",
    shortName: "Step 3.7 Flash",
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
