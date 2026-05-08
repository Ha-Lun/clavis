"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Copy, Check, Zap, User, FileText, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import type { Message } from "@/lib/appwrite/types";
import { extractAttachments } from "@/lib/utils";

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
  const { attachments, cleanContent } = extractAttachments(message.content);

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
        <div className="border-t border-border mb-6" />
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
                ? "bg-primary text-white shadow-stripe-ambient"
                : "bg-secondary text-foreground"
            )}
          >
            {isUser ? <User className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div
          className={cn(
            "group relative",
            isUser ? "max-w-[80%] md:max-w-[70%] items-end" : "flex-1 items-start pr-10"
          )}
        >
          {/* Role label */}
          <p className={cn(
            "text-xs font-medium mb-1.5 tracking-wide",
            isUser ? "text-primary text-right" : "text-muted-foreground"
          )}>
            {isUser ? "You" : "Flux"}
          </p>

          <div
            className={cn(
              "text-[16px] leading-relaxed font-light",
              isUser
                ? "bg-primary text-white rounded-[16px_16px_4px_16px] px-4 py-3 shadow-stripe-ambient"
                : "text-foreground",
              isStreaming && !isUser && "border-transparent"
            )}
          >
            {isUser && attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {attachments.map((file, i) => (
                  <a
                    key={i}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-[8px] px-3 py-1.5 transition-colors group/file"
                  >
                    <FileText className="h-4 w-4 text-white/70" />
                    <span className="text-[13px] font-medium max-w-[150px] truncate">
                      {file.name}
                    </span>
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover/file:opacity-100 transition-opacity" />
                  </a>
                ))}
              </div>
            )}
            <div className="break-words">
              {isUser ? (
                <div className="whitespace-pre-wrap">
                  {cleanContent}
                </div>
              ) : (
                <>
                  <ReactMarkdown
                    className="prose prose-slate dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent font-sans"
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline && match ? (
                          <div className="rounded-xl overflow-hidden my-4 border border-border shadow-stripe-ambient">
                            <div className="bg-secondary px-4 py-2 text-xs font-sans text-muted-foreground border-b border-border flex items-center justify-between">
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
                                backgroundColor: "#061b31",
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
                              "bg-secondary/50 text-accent rounded-md px-1.5 py-0.5 font-mono text-[0.85em]",
                              className
                            )}
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                      p: ({ children }) => <p className="mb-3 last:mb-0 font-light">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-5 mb-4 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-5 mb-4 space-y-1">{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                      h1: ({ children }) => <h1 className="text-2xl font-light tracking-tight mb-3 mt-5 text-foreground">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-xl font-light tracking-tight mb-3 mt-5 text-foreground">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-lg font-light tracking-tight mb-2 mt-4 text-foreground">{children}</h3>,
                      a: ({ children, href }) => <a href={href} className="text-primary hover:text-primary/80 underline underline-offset-4 transition-colors">{children}</a>,
                      strong: ({ children }) => <strong className="font-normal text-foreground">{children}</strong>,
                      blockquote: ({ children }) => <blockquote className="border-l-2 border-primary pl-4 italic text-muted-foreground my-4">{children}</blockquote>,
                    }}
                  >
                    {message.content + (isStreaming ? " ▍" : "")}
                  </ReactMarkdown>
                  
                  {!isStreaming && modelName && (
                    <p className="mt-4 text-[10px] text-muted-foreground/50 font-medium uppercase tracking-widest">
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
                className="h-7 px-2 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 gap-1.5"
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
