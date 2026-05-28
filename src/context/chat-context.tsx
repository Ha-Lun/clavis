"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import type { Chat, Message } from "@/lib/appwrite/types";

interface ChatContextType {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
  showReasoning: boolean;
  setShowReasoning: (show: boolean) => void;
  setChats: (chats: Chat[]) => void;
  setActiveChat: (chat: Chat | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setIsStreaming: (streaming: boolean) => void;
  setStreamingContent: (content: string) => void;
  appendStreamingContent: (chunk: string) => void;
  updateChatTitle: (chatId: string, title: string) => void;
  updateChatModel: (chatId: string, model: string) => void;
  toggleChatPin: (chatId: string, isPinned: boolean) => void;
  removeChat: (chatId: string) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");

  const setMessagesWithLog = useCallback((msgs: Message[] | ((prev: Message[]) => Message[])) => {
    if (typeof msgs === 'function') {
      setMessages((prev) => {
        const newMsgs = msgs(prev);
        console.log("[DEBUG chat-context] setMessages function called, new count:", newMsgs.length);
        return newMsgs;
      });
    } else {
      console.log("[DEBUG chat-context] setMessages called with", msgs.length, "messages");
      console.log("[DEBUG chat-context] messages content:", JSON.stringify(msgs));
      setMessages(msgs);
    }
  }, []);

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const appendStreamingContent = useCallback((chunk: string) => {
    setStreamingContent((prev) => prev + chunk);
  }, []);

  const updateChatTitle = useCallback((chatId: string, title: string) => {
    setChats((prev) =>
      prev.map((c) => (c.$id === chatId ? { ...c, title } : c))
    );
    setActiveChat((prev) =>
      prev?.$id === chatId ? { ...prev, title } : prev
    );
  }, []);

  const updateChatModel = useCallback((chatId: string, model: string) => {
    setChats((prev) =>
      prev.map((c) => (c.$id === chatId ? { ...c, model } : c))
    );
    setActiveChat((prev) =>
      prev?.$id === chatId ? { ...prev, model } : prev
    );
  }, []);

  const toggleChatPin = useCallback((chatId: string, isPinned: boolean) => {
    setChats((prev) =>
      prev.map((c) => {
        return c.$id === chatId ? { ...c, isPinned } : c;
      })
    );
    setActiveChat((prev) => {
      return prev?.$id === chatId ? { ...prev!, isPinned } : prev;
    });
  }, []);

  const removeChat = useCallback((chatId: string) => {
    setChats((prev) => prev.filter((c) => c.$id !== chatId));
    setActiveChat((prev) => (prev?.$id === chatId ? null : prev));
  }, []);

  const [showReasoning, setShowReasoningState] = useState(false);

  useEffect(() => {
    const fetchUserPrefs = async () => {
      try {
        const res = await fetch("/api/user");
        if (res.ok) {
          const data = await res.json();
          setShowReasoningState(data.prefs?.showReasoning ?? false);
        }
      } catch (err) {
        console.error("Failed to fetch user prefs in ChatProvider:", err);
      }
    };
    fetchUserPrefs();
  }, []);

  const setShowReasoning = useCallback(async (show: boolean) => {
    setShowReasoningState(show);
    try {
      await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefs: { showReasoning: show } }),
      });
    } catch (err) {
      console.error("Failed to update showReasoning preference:", err);
    }
  }, []);

  return (
    <ChatContext.Provider
      value={{
        chats,
        activeChat,
        messages,
        isStreaming,
        streamingContent,
        showReasoning,
        setShowReasoning,
        setChats,
        setActiveChat,
        setMessages: setMessagesWithLog,
        addMessage,
        setIsStreaming,
        setStreamingContent,
        appendStreamingContent,
        updateChatTitle,
        updateChatModel,
        toggleChatPin,
        removeChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
