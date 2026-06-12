/**
 * Model Routing Decision Tree:
 *
 * 1. Coding / Technical (Kimi K2.6)
 *    - Keywords: code, debug, refactor, function, bug, error, fix, implement, api, sql, css, html, react,
 *      component, script, compile, syntax, regex, algorithm, deploy, git, database, json, typescript,
 *      python, class, import, export, const, var, let, dockerfile, bash, terminal, npm, yarn, pip,
 *      library, framework, stack trace, undefined, null pointer, runtime, build.
 *    - Structural: Contains backticks (`) or bracket/brace density > 2 per 50 characters.
 *
 * 2. Creative / Long-form Writing (MiniMax M3)
 *    - Keywords: write, story, essay, poem, article, blog, draft, novel, narrative, screenplay,
 *      summarize, translate, proofread, edit my, rewrite, creative, fiction, character, plot,
 *      lyrics, caption, cover letter.
 *    - Structural: Length > 400 characters and reads as block text (not a question).
 *
 * 3. Reasoning / Analysis / Math (Qwen 3.5)
 *    - Keywords: explain, analyze, compare, difference between, pros and cons, why does,
 *      how does, logic, prove, evaluate, math, calculate, solve, step by step, think through,
 *      debate, argument, philosophy, what is the best, should i, which is better, tradeoffs, versus, vs.
 *
 * 4. Simple / Conversational (Nemotron Nano)
 *    - Criteria: Word count < 12 AND does NOT contain any complex keywords (what, why, how, explain,
 *      describe, compare, analyze, write, calculate).
 *
 * 5. General Fallback (Mistral Small 4)
 *    - Any message not matching the above rules.
 *
 * CONSTRAINT: Never auto-route to "deepseek-ai/deepseek-v4-pro".
 */

import { getModelInfo } from "./models";

export type MessageParam = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
};

export function routeModel(_messages: MessageParam[]): string {
  // Auto mode now always routes directly to Mistral Small 4
  return "mistralai/mistral-small-4-119b-2603";
}

export function getRoutingLabel(modelId: string): string {
  if (modelId === "auto") return "Auto";
  return getModelInfo(modelId).name;
}
