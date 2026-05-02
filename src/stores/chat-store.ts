"use client";

import { create } from "zustand";
import type { Chat, Message } from "@/lib/appwrite/types";

interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;

  setChats: (chats: Chat[]) => void;
  setActiveChat: (chat: Chat | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setIsStreaming: (streaming: boolean) => void;
  setStreamingContent: (content: string) => void;
  appendStreamingContent: (chunk: string) => void;
  updateChatTitle: (chatId: string, title: string) => void;
  updateChatModel: (chatId: string, model: string) => void;
  removeChat: (chatId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  chats: [],
  activeChat: null,
  messages: [],
  isStreaming: false,
  streamingContent: "",

  setChats: (chats) => set({ chats }),
  setActiveChat: (chat) => set({ activeChat: chat }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setIsStreaming: (streaming) => set({ isStreaming: streaming }),
  setStreamingContent: (content) => set({ streamingContent: content }),
  appendStreamingContent: (chunk) =>
    set((state) => ({
      streamingContent: state.streamingContent + chunk,
    })),
  updateChatTitle: (chatId, title) =>
    set((state) => ({
      chats: state.chats.map((c) =>
        c.id === chatId ? { ...c, title } : c
      ),
      activeChat:
        state.activeChat?.id === chatId
          ? { ...state.activeChat, title }
          : state.activeChat,
    })),
  updateChatModel: (chatId, model) =>
    set((state) => ({
      chats: state.chats.map((c) =>
        c.id === chatId ? { ...c, model } : c
      ),
      activeChat:
        state.activeChat?.id === chatId
          ? { ...state.activeChat, model }
          : state.activeChat,
    })),
  removeChat: (chatId) =>
    set((state) => ({
      chats: state.chats.filter((c) => c.id !== chatId),
      activeChat:
        state.activeChat?.id === chatId ? null : state.activeChat,
    })),
}));
