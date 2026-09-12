/**
 * Model Routing:
 *
 * Default Fallback (Nemotron 3 Nano)
 */

import { getModelInfo } from "./models";

export type MessageParam = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
};

export function routeModel(_messages: MessageParam[]): string {
  return "nvidia/nemotron-3.5-lightning-30b-a3b";
}

export function getRoutingLabel(modelId: string): string {
  if (modelId === "auto") return "Auto";
  return getModelInfo(modelId).name;
}
