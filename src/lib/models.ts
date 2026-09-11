export type ModelId =
  | "auto"
  | "meta/muse-glimmer-30b"
  | "nvidia/nemotron-3.5-lightning-30b-a3b"
  | "nvidia/nemotron-3-ultra-550b-a55b"
  | "nvidia/nemotron-3-super-120b-a12b"
  | "poolside/laguna-xs-2.1"
  | "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning"
  | "google/gemma-4-31b-it";

export interface ModelInfo {
  id: ModelId;
  name: string;
  shortName: string;
  supportsTools?: boolean;
}

export const MODELS: ModelInfo[] = [
  {
    id: "auto",
    name: "Auto",
    shortName: "Auto",
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
    id: "nvidia/nemotron-3-super-120b-a12b",
    name: "Nemotron 3 Super 120B",
    shortName: "Nemotron Super",
  },
  {
    id: "poolside/laguna-xs-2.1",
    name: "Laguna XS 2.1",
    shortName: "Laguna XS 2.1",
    supportsTools: false,
  },
  {
    id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
    name: "Nemotron 3 Nano Omni Reasoning",
    shortName: "Nemotron Nano Omni",
    supportsTools: false,
  },
  {
    id: "google/gemma-4-31b-it",
    name: "Gemma 4 31B",
    shortName: "Gemma 4 31B",
    supportsTools: false,
  },
];

export const DEFAULT_MODEL: ModelId = "meta/muse-glimmer-30b";

export function getModelInfo(modelId: string): ModelInfo {
  return (
    MODELS.find((m) => m.id === modelId) ?? {
      id: modelId as ModelId,
      name: modelId,
      shortName: modelId.split("/").pop() ?? modelId,
    }
  );
}
