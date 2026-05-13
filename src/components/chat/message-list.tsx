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

  if (messages.length === 0 && !isStreaming) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex-1 flex items-center justify-center p-8"
      >
        <div className="text-center">
          <p className="text-[20px] font-light tracking-tight text-muted-foreground/50 mb-2">
            What can I help you with?
          </p>
          <p className="text-[13px] text-muted-foreground/30 font-light">
            Send a message below to begin
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
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <MessageBubble
              key={message.$id}
              message={message}
              index={index}
              modelName={message.role === "assistant" ? modelName : undefined}
            />
          ))}
        </AnimatePresence>

        {isStreaming && (smoothContent || streamingContent) && (
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
        )}

        {isStreaming && !streamingContent && (
          <ThinkingIndicator modelId={modelId} />
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
