"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Copy, Check, Zap, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import type { Message } from "@/lib/appwrite/types";

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

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="animate-fade-up"
      style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
    >
      {/* Subtle divider between messages */}
      {index > 0 && (
        <div className="border-t border-[#1e1a2e]/60 mb-6" />
      )}

      <div
        className={cn(
          "flex gap-3",
          isUser ? "flex-row-reverse" : "flex-row"
        )}
      >
        {/* Avatar */}
        <Avatar className="h-7 w-7 shrink-0 mt-1">
          <AvatarFallback
            className={cn(
              "text-xs",
              isUser
                ? "bg-[#7c3aed]/20 text-[#a78bfa]"
                : "bg-[#c9a84c]/15 text-[#c9a84c]"
            )}
          >
            {isUser ? <User className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div
          className={cn(
            "group relative",
            isUser ? "max-w-[80%] md:max-w-[70%] items-end" : "flex-1 items-start"
          )}
        >
          {/* Role label */}
          <p className={cn(
            "text-xs font-semibold mb-1.5 tracking-wide",
            isUser ? "text-[#a78bfa] text-right" : "text-[#c9a84c]"
          )}>
            {isUser ? "You" : "Flux"}
          </p>

          <div
            className={cn(
              "text-base leading-relaxed font-normal",
              isUser
                ? "bg-[#7c3aed]/15 border border-[#7c3aed]/30 backdrop-blur-md rounded-[16px_16px_4px_16px] px-4 py-3"
                : "text-[#f5f0ff]/90",
              isStreaming && !isUser && "border-transparent"
            )}
          >
            <div className="break-words">
              {isUser ? (
                <div className="whitespace-pre-wrap">
                  {message.content}
                </div>
              ) : (
                <>
                  <ReactMarkdown
                    className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent font-sans"
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline && match ? (
                          <div className="rounded-xl overflow-hidden my-4 border border-[#1e1a2e] shadow-lg">
                            <div className="bg-[#0f0d1a] px-4 py-2 text-xs font-sans text-muted-foreground border-b border-[#1e1a2e] flex items-center justify-between">
                              <span>{match[1]}</span>
                            </div>
                            <SyntaxHighlighter
                              {...props}
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              customStyle={{
                                margin: 0,
                                padding: "1rem",
                                backgroundColor: "#0a0a0f",
                                fontSize: "0.875rem",
                                fontFamily: "monospace",
                              }}
                            >
                              {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                          </div>
                        ) : (
                          <code
                            className={cn(
                              "bg-black/30 rounded-md px-1.5 py-0.5 font-mono text-[0.85em] text-[#a78bfa]",
                              className
                            )}
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                      p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-5 mb-4 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-5 mb-4 space-y-1">{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                      h1: ({ children }) => <h1 className="text-2xl font-semibold mb-3 mt-5 text-[#c9a84c]">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-xl font-semibold mb-3 mt-5 text-[#c9a84c]">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-lg font-semibold mb-2 mt-4 text-[#c9a84c]">{children}</h3>,
                      a: ({ children, href }) => <a href={href} className="text-[#a78bfa] hover:text-[#c9a84c] underline underline-offset-4 transition-colors">{children}</a>,
                      strong: ({ children }) => <strong className="font-semibold text-[#f5f0ff]">{children}</strong>,
                      blockquote: ({ children }) => <blockquote className="border-l-2 border-[#7c3aed] pl-4 italic text-muted-foreground my-4">{children}</blockquote>,
                    }}
                  >
                    {message.content + (isStreaming ? " ▍" : "")}
                  </ReactMarkdown>
                  
                  {!isStreaming && modelName && (
                    <p className="mt-4 text-[10px] text-muted-foreground/30 font-medium uppercase tracking-widest">
                      Prepared using {modelName}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Copy button — assistant messages only, on hover */}
          {!isUser && !isStreaming && message.content && (
            <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-[#c9a84c] gap-1.5"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-green-500" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
