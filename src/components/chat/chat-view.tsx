"use client";

import { useEffect, useCallback, useRef } from "react";
import { useChatStore } from "@/stores/chat-store";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { ModelSelector } from "./model-selector";
import { useSmoothStream } from "@/hooks/use-smooth-stream";
import type { Chat, Message } from "@/lib/appwrite/types";

interface ChatViewProps {
  chat: Chat;
  initialMessages: Message[];
}

export function ChatView({ chat, initialMessages }: ChatViewProps) {
  const {
    messages,
    setMessages,
    setActiveChat,
    addMessage,
    isStreaming,
    setIsStreaming,
    streamingContent,
    setStreamingContent,
    appendStreamingContent,
    updateChatTitle,
  } = useChatStore();

  const hasGeneratedTitle = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const smoothContent = useSmoothStream(streamingContent, isStreaming, 15);

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  useEffect(() => {
    setActiveChat(chat);
    setMessages(initialMessages);
    hasGeneratedTitle.current = initialMessages.length > 0;
    return () => {
      setActiveChat(null);
      setMessages([]);
      setStreamingContent("");
    };
  }, [chat, initialMessages, setActiveChat, setMessages, setStreamingContent]);

  const generateTitle = useCallback(
    async (firstMessage: string) => {
      if (hasGeneratedTitle.current) return;
      hasGeneratedTitle.current = true;

      try {
        const res = await fetch("/api/chat/title", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatId: chat.id,
            firstMessage,
            model: chat.model,
          }),
        });
        const data = await res.json();
        if (data.title) {
          updateChatTitle(chat.id, data.title);
        }
      } catch (err) {
        console.error("Title generation failed:", err);
      }
    },
    [chat.id, chat.model, updateChatTitle]
  );

  const handleSend = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      // Add user message optimistically
      const userMessage: Message = {
        $id: crypto.randomUUID(),
        $collectionId: "",
        $databaseId: "",
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString(),
        $permissions: [],
        chat_id: chat.id,
        role: "user",
        content: content.trim(),
      };
      addMessage(userMessage);

      // Generate title from first message
      if (messages.length === 0) {
        generateTitle(content.trim());
      }

      setIsStreaming(true);
      setStreamingContent("");

      abortControllerRef.current = new AbortController();

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortControllerRef.current.signal,
          body: JSON.stringify({
            chatId: chat.id,
            message: content.trim(),
            model: chat.model,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to send message");
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;
          appendStreamingContent(chunk);
        }

        // Add completed assistant message
        const assistantMessage: Message = {
          $id: crypto.randomUUID(),
          $collectionId: "",
          $databaseId: "",
          $createdAt: new Date().toISOString(),
          $updatedAt: new Date().toISOString(),
          $permissions: [],
          chat_id: chat.id,
          role: "assistant",
          content: fullContent,
        };
        addMessage(assistantMessage);
      } catch (err: any) {
        if (err.name === "AbortError") {
          // Save partial message
          const partialContent = useChatStore.getState().streamingContent;
          if (partialContent) {
            const partialMessage: Message = {
              $id: crypto.randomUUID(),
              $collectionId: "",
              $databaseId: "",
              $createdAt: new Date().toISOString(),
              $updatedAt: new Date().toISOString(),
              $permissions: [],
              chat_id: chat.id,
              role: "assistant",
              content: partialContent,
            };
            addMessage(partialMessage);
          }
        } else {
          const errorMessage: Message = {
            $id: crypto.randomUUID(),
            $collectionId: "",
            $databaseId: "",
            $createdAt: new Date().toISOString(),
            $updatedAt: new Date().toISOString(),
            $permissions: [],
            chat_id: chat.id,
            role: "assistant",
            content:
              err instanceof Error
                ? `⚠️ ${err.message}`
                : "⚠️ Something went wrong. Please try again.",
          };
          addMessage(errorMessage);
        }
      } finally {
        setIsStreaming(false);
        setStreamingContent("");
      }
    },
    [
      chat.id,
      chat.model,
      isStreaming,
      messages.length,
      addMessage,
      appendStreamingContent,
      generateTitle,
      setIsStreaming,
      setStreamingContent,
    ]
  );

  useEffect(() => {
    const pendingPrompt = sessionStorage.getItem("pending_prompt");
    if (pendingPrompt && messages.length === 0) {
      sessionStorage.removeItem("pending_prompt");
      // Add a slight delay to allow the layout to settle and initialMessages to hydrate
      const timeout = setTimeout(() => {
        handleSend(pendingPrompt);
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [messages.length, handleSend]);

  return (
    <div className="flex flex-col h-full">
      <div key={chat.id} className="flex-1 overflow-hidden flex flex-col animate-fade-in">
        <MessageList
          messages={messages}
          isStreaming={isStreaming}
          streamingContent={smoothContent}
          modelId={chat.model}
        />
      </div>
      <div className="flex flex-col">
        <ChatInput 
          onSend={handleSend} 
          onStop={handleStop} 
          isStreaming={isStreaming} 
          chatId={chat.id} 
          currentModel={chat.model}
        />
      </div>
    </div>
  );
}
