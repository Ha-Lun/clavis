export type ModelId =
  | "auto"
  | "meta/muse-glimmer-30b"
  | "nvidia/nemotron-3.5-lightning-30b-a3b"
  | "nvidia/nemotron-3-ultra-550b-a55b"
  | "poolside/laguna-xs-2.1"
  | "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning"
  | "nvidia/nemotron-3-super-120b-a12b";

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
    id: "poolside/laguna-xs-2.1",
    name: "Laguna XS 2.1",
    shortName: "Laguna XS 2.1",
  },
  {
    id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
    name: "Nemotron 3 Nano Omni Reasoning",
    shortName: "Nemotron Nano Omni",
  },
  {
    id: "nvidia/nemotron-3-super-120b-a12b",
    name: "Nemotron 3 Super 120B",
    shortName: "Nemotron Super",
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
