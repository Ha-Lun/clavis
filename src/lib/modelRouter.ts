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
 * 2. Creative / Long-form Writing (MiniMax M2.7)
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

export function routeModel(messages: MessageParam[]): string {
  const userMessages = messages.filter(m => m.role === "user");
  if (userMessages.length === 0) {
    return "mistralai/mistral-small-4-119b-2603";
  }

  const lastMessage = userMessages[userMessages.length - 1].content.toLowerCase();

  // RULE 1: Coding / Technical (Kimi K2.6)
  const codingKeywords = [
    "code", "debug", "refactor", "function", "bug", "error", "fix", "implement", "api", "sql",
    "css", "html", "react", "component", "script", "compile", "syntax", "regex", "algorithm",
    "deploy", "git", "database", "json", "typescript", "python", "class", "import", "export",
    "const", "var", "let", "dockerfile", "bash", "terminal", "npm", "yarn", "pip", "library",
    "framework", "stack trace", "undefined", "null pointer", "runtime", "build"
  ];

  const hasCodingKeyword = codingKeywords.some(k => lastMessage.includes(k));
  const hasBackticks = lastMessage.includes("`");
  const braceCount = (lastMessage.match(/[\[\{\(\)]/g) || []).length;
  const isBraceDense = braceCount > 2 && (braceCount / lastMessage.length) > (2 / 50);

  if (hasCodingKeyword || hasBackticks || isBraceDense) {
    return "moonshotai/kimi-k2.6";
  }

  // RULE 2: Creative / Long-form Writing (MiniMax M2.7)
  const creativeKeywords = [
    "write", "story", "essay", "poem", "article", "blog", "draft", "novel", "narrative",
    "screenplay", "summarize", "translate", "proofread", "edit my", "rewrite",
    "creative", "fiction", "character", "plot", "lyrics", "caption", "cover letter"
  ];

  const hasCreativeKeyword = creativeKeywords.some(k => lastMessage.includes(k));
  const isLongBlock = lastMessage.length > 400 && !lastMessage.includes("?");

  if (hasCreativeKeyword || isLongBlock) {
    return "minimaxai/minimax-m2.7";
  }

  // RULE 3: Reasoning / Analysis / Math (Qwen 3.5)
  const reasoningKeywords = [
    "explain", "analyze", "compare", "difference between", "pros and cons", "why does",
    "how does", "logic", "prove", "evaluate", "math", "calculate", "solve",
    "step by step", "think through", "debate", "argument", "philosophy",
    "what is the best", "should i", "which is better", "tradeoffs", "versus", "vs"
  ];

  if (reasoningKeywords.some(k => lastMessage.includes(k))) {
    return "qwen/qwen3.5-122b-a10b";
  }

  // RULE 4: Simple / Conversational (Nemotron Nano)
  const simpleKeywords = ["what", "why", "how", "explain", "describe", "compare", "analyze", "write", "calculate"];
  const wordCount = lastMessage.trim().split(/\s+/).length;
  const hasComplexKeyword = simpleKeywords.some(k => lastMessage.includes(k));

  if (wordCount < 12 && !hasComplexKeyword) {
    return "nvidia/nemotron-3-nano-30b-a3b";
  }

  // RULE 5: Fallback (Mistral Small 4)
  return "mistralai/mistral-small-4-119b-2603";
}

export function getRoutingLabel(modelId: string): string {
  if (modelId === "auto") return "Auto";
  return getModelInfo(modelId).name;
}
