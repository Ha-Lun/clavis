/**
 * Model Routing:
 *
 * Default Fallback (GPT OSS 120B)
 */

import { getModelInfo } from "./models";

export type MessageParam = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
};

export function routeModel(messages: MessageParam[]): string {
  // Check recent messages for Canvas/course-related keywords
  const canvasKeywords = [
    "canvas", "course", "courses", "assignment", "assignments", 
    "syllabus", "module", "modules", "announcement", "announcements", 
    "due date", "quiz", "exam", "homework", "grade", "grades", "upcoming"
  ];

  // Look at the last few messages, prioritizing user messages
  const recentMessages = messages.slice(-5);
  for (const msg of recentMessages) {
    if (msg.role === "user" && msg.content) {
      const lowerContent = msg.content.toLowerCase();
      if (canvasKeywords.some(keyword => lowerContent.includes(keyword))) {
        return "openai/gpt-oss-120b";
      }
    } else if (msg.tool_calls && msg.tool_calls.length > 0) {
      // If there are tool calls to canvas functions, also route to Groq
      for (const call of msg.tool_calls) {
        if (call.function?.name?.includes("canvas") || call.function?.name?.includes("course")) {
          return "openai/gpt-oss-120b";
        }
      }
    }
  }

  return "openai/gpt-oss-120b";
}

export function getRoutingLabel(modelId: string): string {
  if (modelId === "auto") return "Auto";
  return getModelInfo(modelId).name;
}
