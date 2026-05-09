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
import { extractAttachments, extractFileRefs } from "@/lib/utils";
import { motion } from "framer-motion";

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
  
  // Extract all metadata and clean content sequentially
  const { attachments, cleanContent: contentWithoutAttachments } = extractAttachments(message.content);
  const { fileRefs, cleanContent: displayContent } = extractFileRefs(contentWithoutAttachments);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: Math.min(index * 0.04, 0.25) }}
    >
      {/* Subtle divider between messages */}
      {index > 0 && (
        <div className="border-t border-glass-border my-8" />
      )}

      <div
        className={cn(
          "flex gap-4.5",
          isUser ? "flex-row-reverse" : "flex-row"
        )}
      >
        {/* Avatar */}
        <Avatar className="h-8 w-8 shrink-0 mt-0.5 relative overflow-hidden">
          <AvatarFallback
            className={cn(
              "text-xs transition-all duration-300",
              isUser
                ? "bg-secondary/80 text-foreground border border-glass-border shadow-velvet-ambient"
                : "bg-gold/10 text-gold border border-gold/25 shadow-gold-glow"
            )}
          >
            {isUser ? (
              <User className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Zap className="h-4 w-4 text-gold fill-gold/20" />
            )}
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
            "text-[11px] font-medium mb-1.5 tracking-widest uppercase text-muted-foreground/45",
            isUser ? "text-right" : "text-left"
          )}>
            {isUser ? "You" : "Flux"}
          </p>

          <div
            className={cn(
              "text-[15.5px] leading-relaxed font-light",
              isUser
                ? "bg-primary/10 border border-primary/25 text-foreground rounded-[16px_16px_4px_16px] px-4.5 py-3.5 shadow-velvet-ambient"
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
                    className="flex items-center gap-2 bg-secondary/30 hover:bg-glass-highlight border border-glass-border rounded-luxury-sm px-3 py-1.5 transition-all group/file"
                  >
                    <FileText className="h-4 w-4 text-gold/80" />
                    <span className="text-[13px] font-medium max-w-[150px] truncate text-foreground/80">
                      {file.name}
                    </span>
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover/file:opacity-100 transition-opacity" />
                  </a>
                ))}
              </div>
            )}
            <div className="break-words">
              {isUser ? (
                <div className="whitespace-pre-wrap font-sans">
                  {displayContent}
                </div>
              ) : (
                <>
                  {fileRefs.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4 animate-fade-in">
                      {fileRefs.map((fileName, i) => (
                        <div 
                          key={i}
                          className="flex items-center gap-1.5 bg-primary/5 border border-primary/10 rounded-luxury-sm px-2.5 py-1 text-[11px] text-primary/80 font-medium shadow-stripe-ambient"
                        >
                          <FileText className="h-3 w-3 text-gold" />
                          <span>{fileName}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <ReactMarkdown
                    className="prose prose-slate dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent font-sans"
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline && match ? (
                          <div className="rounded-xl overflow-hidden my-4 border border-glass-border shadow-velvet-ambient">
                            <div className="bg-void-elevated px-4 py-2.5 text-xs font-sans text-muted-foreground border-b border-glass-border flex items-center justify-between">
                              <span>{match[1]}</span>
                            </div>
                            <SyntaxHighlighter
                              {...props}
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              customStyle={{
                                margin: 0,
                                padding: "1.25rem",
                                backgroundColor: "#08080c",
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
                              "bg-secondary/50 text-gold rounded-md px-1.5 py-0.5 font-mono text-[0.85em] border border-glass-border",
                              className
                            )}
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                      p: ({ children }) => <p className="mb-4 last:mb-0 font-light text-foreground/90">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-5 mb-5 space-y-1.5">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-5 mb-5 space-y-1.5">{children}</ol>,
                      li: ({ children }) => <li className="mb-1 text-foreground/90">{children}</li>,
                      h1: ({ children }) => <h1 className="text-2xl font-light tracking-tight mb-3 mt-6 text-foreground">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-xl font-light tracking-tight mb-3 mt-5 text-foreground">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-lg font-light tracking-tight mb-2 mt-4 text-foreground">{children}</h3>,
                      a: ({ children, href }) => <a href={href} className="text-primary hover:text-primary/80 underline underline-offset-4 transition-colors">{children}</a>,
                      strong: ({ children }) => <strong className="font-normal text-foreground">{children}</strong>,
                      blockquote: ({ children }) => <blockquote className="border-l-2 border-primary pl-4 italic text-muted-foreground my-4">{children}</blockquote>,
                    }}
                  >
                    {displayContent + (isStreaming ? " ▍" : "")}
                  </ReactMarkdown>
                  
                  {!isStreaming && modelName && (
                    <p className="mt-4 text-[10px] text-muted-foreground/35 font-medium uppercase tracking-widest">
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
                className="h-7 px-2.5 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 gap-1.5 rounded-full border border-transparent hover:border-glass-border"
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
    </motion.div>
  );
}
