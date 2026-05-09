"use client";

import { motion } from "framer-motion";
import { Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useChat } from "@/context/chat-context";
import { cn } from "@/lib/utils";

export function NewChatButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { chats, setChats } = useChat();

  const handleNewChat = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const { chat } = await res.json();
      if (chat) {
        const chatWithId = { ...chat, id: chat.$id ?? chat.id };
        setChats([chatWithId, ...chats]);
        router.push(`/dashboard/chat/${chatWithId.id}`);
      }
    } catch (err) {
      console.error("Failed to create chat:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.button
      onClick={handleNewChat}
      disabled={isLoading}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-medium",
        "bg-primary text-white hover:bg-primary/90",
        "transition-colors duration-150 cursor-pointer",
        "disabled:opacity-50 disabled:cursor-not-allowed"
      )}
    >
      {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
      New Chat
    </motion.button>
  );
}
