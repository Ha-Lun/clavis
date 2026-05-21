"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Copy, Check, FileText, ExternalLink, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import type { Message } from "@/lib/appwrite/types";
import { extractAttachments, extractFileRefs } from "@/lib/utils";
import { ThinkingSpinner } from "@/components/ui/thinking-spinner";
import { getRoutingLabel } from "@/lib/modelRouter";

interface MessageBubbleProps {
  message: Message;
  index: number;
  isStreaming?: boolean;
  modelName?: string;
}

export function MessageBubble({
  message,
  index,
  isStreaming,
  modelName,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  // Parse the model from the HTML comment if present
  let rawContent = message.content || "";
  let resolvedModel = (message as any).model || undefined;

  const modelCommentMatch = rawContent.match(/<!--\s*model:\s*([^\s]+)\s*-->/);
  if (modelCommentMatch) {
    resolvedModel = modelCommentMatch[1];
    rawContent = rawContent.replace(/<!--\s*model:\s*[^\s]+\s*-->/, "").trim();
  }

  const { attachments, cleanContent: contentWithoutAttachments } = extractAttachments(rawContent);
  const { fileRefs, cleanContent } = extractFileRefs(contentWithoutAttachments);

  // Handle <think> tags that some reasoning models stream in their content
  let displayContent = cleanContent;
  if (displayContent.includes('<think>')) {
    displayContent = displayContent.replace(/<think>\n?/g, '~~~reasoning\n');
    displayContent = displayContent.replace(/<\/think>\n?/g, '\n~~~\n\n');
  } else if (displayContent.includes('</think>')) {
     displayContent = displayContent.replace(/<\/think>\n?/g, '\n~~~\n\n');
  }
  
  // Automatically close unclosed think blocks while streaming to ensure markdown renders correctly
  if (isStreaming && displayContent.includes('~~~reasoning')) {
    const openCount = (displayContent.match(/~~~reasoning/g) || []).length;
    const closeCount = (displayContent.match(/\n~~~($|\n)/g) || []).length;
    if (openCount > closeCount) {
      displayContent += '\n~~~';
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: Math.min(index * 0.02, 0.1),
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <div
        className={cn(
          "flex gap-3",
          isUser ? "flex-row-reverse" : "flex-row"
        )}
      >
        {/* Content */}
        <div
          className={cn(
            "group relative",
            isUser
              ? "max-w-[78%] md:max-w-[68%]"
              : "flex-1 min-w-0 pr-8"
          )}
        >
          {isUser ? (
            /* ─── User bubble ──────────────────────── */
            <div className="flex flex-col items-end gap-1.5">
              {/* File attachments */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-end">
                  {attachments.map((file, i) => (
                    <a
                      key={i}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-primary/[0.08] hover:bg-primary/[0.14] border border-primary/[0.15] rounded-md px-2.5 py-1 transition-colors group/file cursor-pointer"
                    >
                      <FileText className="h-3.5 w-3.5 text-primary/70" />
                      <span className="text-[12px] font-medium max-w-[140px] truncate text-foreground">
                        {file.name}
                      </span>
                      <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover/file:opacity-60 transition-opacity text-muted-foreground" />
                    </a>
                  ))}
                </div>
              )}

              {displayContent && (
                <div className="bg-primary/[0.07] dark:bg-primary/[0.10] text-foreground rounded-2xl rounded-br-sm px-4 py-2.5 text-[14px] font-light leading-relaxed break-words whitespace-pre-wrap">
                  {displayContent}
                </div>
              )}
            </div>
          ) : (
            /* ─── Clavis message ─────────────────── */
            <div className="min-w-0">
              {/* Clavis sender label */}
              <div className="flex items-center gap-1.5 mb-2">
                <div className="h-5 w-5 rounded-md bg-primary/15 flex items-center justify-center">
                  {/* Roman-inspired key icon */}
                  <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3 text-primary" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
                    <circle cx="12" cy="6" r="4" />
                    <circle cx="12" cy="6" r="1.5" />
                    <path d="M12 10v11" />
                    <path d="M12 17h4v4h-2v-2h-2" />
                  </svg>
                </div>
                <span className="text-[13px] font-medium text-foreground tracking-tight">Clavis</span>
              </div>

              {/* File refs */}
              {fileRefs.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {fileRefs.map((fileName, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1 bg-primary/[0.06] border border-primary/[0.1] rounded-md px-2 py-0.5 text-[11px] text-primary/70 font-medium"
                    >
                      <FileText className="h-2.5 w-2.5" />
                      <span>{fileName}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Markdown content */}
              <ReactMarkdown
                className="prose dark:prose-invert max-w-none prose-p:leading-[1.75] prose-pre:p-0 prose-pre:bg-transparent font-sans"
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || "");
                    const isBlock = !inline && (match || String(children).includes("\n"));
                    
                    if (match && match[1] === "reasoning") {
                      return (
                        <details className="my-3 border-l-2 border-primary/30 bg-primary/[0.02] rounded-r-lg group/think">
                          <summary className="flex items-center gap-2 px-4 py-2 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden text-[11px] font-medium text-muted-foreground uppercase tracking-wider hover:text-muted-foreground/90 transition-colors">
                            <ChevronRight className="h-3.5 w-3.5 text-primary/50 transition-transform duration-200 group-open/think:rotate-90" />
                            {isStreaming && <ThinkingSpinner className="h-3 w-3 text-primary/40" size="12px" />}
                            Thinking Process
                          </summary>
                          <div className="px-4 pb-3 text-muted-foreground/80 font-light text-[14px] leading-relaxed whitespace-pre-wrap font-sans italic">
                            {children}
                          </div>
                        </details>
                      );
                    }

                    return isBlock ? (
                      <div className="rounded-lg overflow-hidden my-3.5 border border-border bg-[#1a1814] dark:bg-[#1a1814] not-prose">
                        {/* Code block header */}
                        <div className="flex items-center justify-between bg-secondary px-4 py-2 border-b border-border">
                          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                            {match ? match[1] : "text"}
                          </span>
                          <CopyCodeButton code={String(children).replace(/\n$/, "")} />
                        </div>
                        <SyntaxHighlighter
                          {...props}
                          style={oneDark}
                          language={match ? match[1] : "text"}
                          PreTag="div"
                          customStyle={{
                            margin: 0,
                            padding: "1rem",
                            background: "transparent",
                            fontSize: "0.8125rem",
                            lineHeight: "1.6",
                            fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                          }}
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      <code
                        className={cn(
                          "bg-secondary text-foreground/90 rounded px-1.5 py-0.5 text-[0.82em] font-mono",
                          className
                        )}
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  p: ({ children }) => (
                    <p className="mb-3 last:mb-0 font-light text-[15px] leading-[1.75]">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-5 mb-4 space-y-1.5 text-[15px]">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-5 mb-4 space-y-1.5 text-[15px]">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="mb-0.5 font-light leading-relaxed">{children}</li>
                  ),
                  h1: ({ children }) => (
                    <h1 className="text-[22px] font-normal tracking-wide mb-3 mt-6 text-foreground">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-[18px] font-normal tracking-wide mb-2.5 mt-5 text-foreground">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-[15px] font-semibold tracking-tight mb-2 mt-4 text-foreground">
                      {children}
                    </h3>
                  ),
                  a: ({ children, href }) => (
                    <a
                      href={href}
                      className="text-primary hover:text-primary/80 underline underline-offset-3 transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {children}
                    </a>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-foreground">{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-muted-foreground">{children}</em>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-primary/30 pl-4 text-muted-foreground my-3 italic">
                      {children}
                    </blockquote>
                  ),
                  hr: () => <hr className="border-border/60 my-5" />,
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-4">
                      <table className="w-full text-[13px] border-collapse">{children}</table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="border border-border px-3 py-2 text-left font-medium bg-secondary text-[12px] uppercase tracking-wider text-muted-foreground">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-border px-3 py-2 text-[13px] font-light">{children}</td>
                  ),
                }}
              >
                {displayContent + (isStreaming ? " ▍" : "")}
              </ReactMarkdown>

              {/* Model attribution */}
              {!isStreaming && (resolvedModel || modelName) && (
                <div className="mt-3 flex flex-col items-start gap-0.5">
                  <p className="text-[10px] text-muted-foreground/30 font-medium uppercase tracking-widest">
                    {resolvedModel ? getRoutingLabel(resolvedModel) : modelName}
                  </p>
                  {((modelName === "Auto") || (resolvedModel && getRoutingLabel(resolvedModel) !== modelName)) && resolvedModel && resolvedModel !== "Auto" && (
                    <p className="text-[10px] text-muted-foreground/50 font-light italic">
                      {modelName === "Auto" ? "Auto" : "Switched"} → {getRoutingLabel(resolvedModel)}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Copy button — assistant messages */}
          {!isUser && !isStreaming && message.content && (
            <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
              <button
                onClick={handleCopy}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium",
                  "text-muted-foreground/50 hover:text-muted-foreground",
                  "hover:bg-foreground/[0.05] transition-colors cursor-pointer"
                )}
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-green-600 dark:text-green-500" />
                    <span className="text-green-600 dark:text-green-500">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Inline copy button for code blocks ─────────
function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-pointer"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-green-600 dark:text-green-500" />
          <span className="text-green-600 dark:text-green-500">Copied</span>
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}
