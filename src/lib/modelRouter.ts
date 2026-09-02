/**
 * Model Routing:
 *
 * Default Fallback (Laguna XS 2)
 */

import { getModelInfo } from "./models";

export type MessageParam = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
};

export function routeModel(_messages: MessageParam[]): string {
  // Auto mode routes directly to Laguna XS 2
  return "poolside/laguna-xs-2";
}

export function getRoutingLabel(modelId: string): string {
  if (modelId === "auto") return "Auto";
  return getModelInfo(modelId).name;
}
