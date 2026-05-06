"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@/context/chat-context";
import { MessageBubble } from "./message-bubble";
import { ThinkingIndicator } from "./thinking-indicator";
import { getModelInfo } from "@/lib/models";

interface MessageListProps {
  modelId: string;
}

export function MessageList({ modelId }: MessageListProps) {
  const { messages, isStreaming, streamingContent } = useChat();
  
  console.log("[DEBUG MessageList] messages count:", messages.length);
  console.log("[DEBUG MessageList] messages:", JSON.stringify(messages));

  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const modelName = getModelInfo(modelId).name;

  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    // User is considered at the bottom if they are within 150px
    const isAtBottom = scrollHeight - scrollTop - clientHeight <= 150;
    setIsAutoScrollEnabled(isAtBottom);
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (isAutoScrollEnabled) {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [messages, streamingContent, isAutoScrollEnabled]);

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center animate-fade-in">
          <div className="h-16 w-16 rounded-2xl bg-[#533afd]/10 flex items-center justify-center mx-auto mb-4">
            <svg
              className="h-8 w-8 text-[#533afd]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-light tracking-tight mb-2 text-[#061b31]">Start a conversation</h2>
          <p className="text-[#64748d] text-[15px] font-light max-w-sm">
            Send a message to begin chatting with the AI. You can switch models
            at any time using the selector below.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6"
      onScroll={handleScroll}
    >
      <div className="max-w-3xl mx-auto space-y-2">
        {messages.map((message, index) => (
          <MessageBubble 
            key={message.$id} 
            message={message} 
            index={index} 
            modelName={message.role === "assistant" ? modelName : undefined}
          />
        ))}

        {isStreaming && streamingContent && (
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
              content: streamingContent,
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
