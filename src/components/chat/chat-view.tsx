"use client";

import { useEffect, useCallback, useRef } from "react";
import { useChat } from "@/context/chat-context";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { useSmoothStream } from "@/hooks/use-smooth-stream";
import type { Chat, Message } from "@/lib/appwrite/types";

interface ChatViewProps {
  chat: Chat;
  initialMessages: Message[];
  processInitial?: boolean;
}

export function ChatView({ chat, initialMessages, processInitial }: ChatViewProps) {
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
    activeChat,
  } = useChat();

  const hasGeneratedTitle = useRef(initialMessages.length > 0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const prevChatIdRef = useRef<string | null>(null);
  const hasTriggeredInitialSend = useRef(false);

  const smoothContent = useSmoothStream(streamingContent, isStreaming, 15);

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

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
             model: activeChat?.model || chat.model,
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
    [chat.id, activeChat?.model, updateChatTitle]
  );

  const handleSend = useCallback(
    async (content: string, skipUserMessage: boolean = false) => {
      if (!content.trim() || isStreaming) return;

      // Skip adding user message if it's already in initialMessages (to avoid duplicate)
      if (!skipUserMessage) {
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
      }

      if (messages.length === 0 && !skipUserMessage) {
        generateTitle(content.trim());
      } else if (skipUserMessage && initialMessages.length === 1) {
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
             model: activeChat?.model || chat.model,
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
          const partialContent = streamingContent;
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
            content: err instanceof Error ? `⚠️ ${err.message}` : "⚠️ Something went wrong.",
          };
          addMessage(errorMessage);
        }
      } finally {
        // Small delay to ensure message renders before clearing streaming state
        setTimeout(() => {
          setIsStreaming(false);
        }, 10);
      }
    },
    [
      chat.id,
      activeChat?.model,
      isStreaming,
      addMessage,
      appendStreamingContent,
      generateTitle,
      setIsStreaming,
      setStreamingContent,
      initialMessages,
      messages.length,
    ]
  );

  // Run processInitial and set messages in useEffect safely
  useEffect(() => {
    if (prevChatIdRef.current !== chat.id) {
       hasTriggeredInitialSend.current = false;
       prevChatIdRef.current = chat.id;
    }

    setMessages(initialMessages);
    setActiveChat(chat);
    
    // If processInitial flag is set, trigger the API call
    if (processInitial && initialMessages.length > 0 && !hasTriggeredInitialSend.current) {
      hasTriggeredInitialSend.current = true;
      const initialContent = initialMessages[0].content;
      handleSend(initialContent, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.id, initialMessages]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      setActiveChat(null);
      setMessages([]);
      setStreamingContent("");
    };
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden flex flex-col animate-fade-in">
        <MessageList
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