"use client";

import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useChat } from "@/context/chat-context";

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
    <Button 
      onClick={handleNewChat} 
      disabled={isLoading} 
      className="gap-2 bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] border border-transparent hover:border-[#c9a84c] transition-all duration-200 text-[#f5f0ff]"
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
      New Chat
    </Button>
  );
}
