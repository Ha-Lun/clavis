/**
 * Model Routing:
 *
 * Default Fallback (Step 3.7 Flash)
 */

import { getModelInfo } from "./models";

export type MessageParam = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
};

export function routeModel(_messages: MessageParam[]): string {
  // Auto mode routes directly to Step 3.7 Flash
  return "stepfun-ai/step-3.7-flash";
}

export function getRoutingLabel(modelId: string): string {
  if (modelId === "auto") return "Auto";
  return getModelInfo(modelId).name;
}
