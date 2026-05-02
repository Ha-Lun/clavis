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
}

export function MessageBubble({
  message,
  index,
  isStreaming,
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
      className={cn(
        "flex gap-3 animate-fade-up",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
      style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
    >
      {/* Avatar */}
      <Avatar className="h-8 w-8 shrink-0 mt-1">
        <AvatarFallback
          className={cn(
            "text-xs",
            isUser
              ? "bg-primary/20 text-primary"
              : "bg-secondary text-secondary-foreground"
          )}
        >
          {isUser ? <User className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div
        className={cn(
          "group relative max-w-[85%] md:max-w-[75%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "px-4 py-3 text-base leading-relaxed font-normal",
            isUser
              ? "bg-[#7c3aed]/15 border border-[#7c3aed]/30 backdrop-blur-md rounded-[16px_16px_4px_16px]"
              : "bg-white/5 border border-[#a78bfa]/20 backdrop-blur-md rounded-[16px_16px_16px_4px]",
            isStreaming && "border-primary/30"
          )}
        >
          <div className="break-words">
            {isUser ? (
              <div className="whitespace-pre-wrap">
                {message.content}
                {isStreaming && (
                  <span className="inline-block w-1.5 h-4 bg-[#c9a84c] ml-0.5 animate-pulse rounded-sm" />
                )}
              </div>
            ) : (
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
            )}
          </div>
        </div>

        {/* Copy button */}
        {!isStreaming && message.content && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7",
              isUser ? "right-0" : "left-0"
            )}
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
