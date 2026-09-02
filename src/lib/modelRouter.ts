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
  // Auto mode routes directly to Nemotron 3 Nano
  return "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning";
}

export function getRoutingLabel(modelId: string): string {
  if (modelId === "auto") return "Auto";
  return getModelInfo(modelId).name;
}
