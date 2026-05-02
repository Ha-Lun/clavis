"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";
import type { Message } from "@/lib/appwrite/types";

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
}

export function MessageList({
  messages,
  isStreaming,
  streamingContent,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center animate-fade-in">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <svg
              className="h-8 w-8 text-primary"
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
          <h2 className="text-xl font-semibold mb-2">Start a conversation</h2>
          <p className="text-muted-foreground text-sm max-w-sm">
            Send a message to begin chatting with the AI. You can switch models
            at any time using the selector above.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {messages.map((message, index) => (
          <MessageBubble key={message.id} message={message} index={index} />
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

        {isStreaming && !streamingContent && <TypingIndicator />}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
