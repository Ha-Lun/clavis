"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@/context/chat-context";
import { MessageBubble } from "./message-bubble";
import { ThinkingIndicator } from "./thinking-indicator";
import { getModelInfo } from "@/lib/models";

interface MessageListProps {
  modelId: string;
  smoothContent?: string;
}

function toRoman(num: number): string {
  const pairs: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let result = "";
  for (const [value, numeral] of pairs) {
    while (num >= value) {
      result += numeral;
      num -= value;
    }
  }
  return result;
}

export function MessageList({ modelId, smoothContent }: MessageListProps) {
  const { messages, isStreaming, streamingContent } = useChat();

  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isAutoScrollEnabled = useRef(true);
  const modelName = getModelInfo(modelId).name;

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    isAutoScrollEnabled.current = scrollHeight - scrollTop - clientHeight <= 150;
  };

  useEffect(() => {
    if (isAutoScrollEnabled.current) {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [messages, streamingContent, smoothContent]);

  // Calculate turn number (each user-assistant pair = 1 turn)
  let turnCounter = 0;

  if (messages.length === 0 && !isStreaming) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1 flex items-center justify-center p-8"
      >
        <div className="text-center">
          <p className="text-[20px] font-light tracking-tight text-muted-foreground/50 mb-2">
            Pose your question to begin.
          </p>
          <p className="text-[13px] text-muted-foreground/30 font-light">
            Clavis awaits your inquiry.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto scrollbar-thin"
      onScroll={handleScroll}
    >
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-0">
        {/* Clavis header */}
        <div className="text-center mb-8">
          <h2 className="font-cinzel text-[16px] font-normal tracking-[0.1em] text-muted-foreground/40">
            CLAVIS
          </h2>
          <div className="mt-2 mx-auto w-12 h-px bg-primary/30" />
        </div>

        <AnimatePresence initial={false}>
          {messages.map((message, index) => {
            // Track turn numbers: increment when we hit a user message
            if (message.role === "user") {
              turnCounter++;
            }
            const currentTurn = turnCounter;

            return (
              <div key={message.$id}>
                {/* Turn separator with Roman numeral */}
                {message.role === "user" && index > 0 && (
                  <div className="flex items-center gap-4 my-6">
                    <div className="flex-1 h-px bg-border/60" />
                    <span className="text-[11px] font-medium text-muted-foreground/35 tracking-[0.15em] uppercase font-cinzel">
                      {toRoman(currentTurn)}
                    </span>
                    <div className="flex-1 h-px bg-border/60" />
                  </div>
                )}
                <div className={message.role === "user" ? "mb-4" : "mb-6"}>
                  <MessageBubble
                    message={message}
                    index={index}
                    modelName={message.role === "assistant" ? modelName : undefined}
                  />
                </div>
              </div>
            );
          })}
        </AnimatePresence>

        {isStreaming && (smoothContent || streamingContent) && (
          <div className="mb-6">
            <MessageBubble
              message={{
                $id: "streaming",
                $collectionId: "",
                $databaseId: "",
                $createdAt: new Date().toISOString(),
                $updatedAt: new Date().toISOString(),
                $permissions: [],
                chat_id: "",
                role: "assistant",
                content: smoothContent || streamingContent,
              }}
              index={messages.length}
              isStreaming
            />
          </div>
        )}

        {isStreaming && (
          <ThinkingIndicator modelId={modelId} />
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
