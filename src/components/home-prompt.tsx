"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/stores/chat-store";
import { DEFAULT_MODEL } from "@/lib/models";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, Code, FileText, Lightbulb, Mail, Bug, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModelSelector } from "@/components/chat/model-selector";

const SUGGESTIONS = [
  { icon: Sparkles, label: "Explain a concept" },
  { icon: Code, label: "Write some code" },
  { icon: FileText, label: "Summarise a document" },
  { icon: Lightbulb, label: "Brainstorm ideas" },
  { icon: Mail, label: "Draft an email" },
  { icon: Bug, label: "Debug my code" },
];

export function HomePrompt() {
  const [content, setContent] = useState("");
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (text: string = content) => {
    if (!text.trim() || isSubmitting) return;
    setIsSubmitting(true);

    // Save prompt for the chat view to pick up
    sessionStorage.setItem("pending_prompt", text.trim());

    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model }),
      });
      const { chat } = await res.json();
      
      if (chat) {
        const chatWithId = { ...chat, id: chat.$id ?? chat.id };
        useChatStore.getState().setChats([chatWithId, ...useChatStore.getState().chats]);
        router.push(`/dashboard/chat/${chatWithId.id}`);
      }
    } catch (err) {
      console.error("Failed to create chat:", err);
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-3xl mx-auto px-4 animate-fade-in">
      {/* Wordmark */}
      <div className="mb-12 text-center">
        <h1 className="text-6xl md:text-7xl font-bold text-[#c9a84c] drop-shadow-[0_0_15px_rgba(201,168,76,0.5)] tracking-wide font-serif italic">
          Flux
        </h1>
      </div>

      {/* Main Input Box */}
      <div className="w-full relative flex flex-col gap-0 bg-white/5 rounded-[24px] border border-[#7c3aed]/30 backdrop-blur-[12px] focus-within:shadow-[0_0_30px_rgba(124,58,237,0.1)] focus-within:border-[#7c3aed]/50 transition-all duration-300">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          rows={4}
          className="w-full resize-none bg-transparent text-lg outline-none placeholder:text-muted-foreground/30 pt-5 px-6 pb-2 scrollbar-thin font-sans"
          disabled={isSubmitting}
        />
        
        {/* Bottom Bar */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full text-muted-foreground/40 hover:text-[#c9a84c] hover:bg-[#c9a84c]/10"
              disabled={isSubmitting}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <ModelSelector 
              currentModel={model} 
              onModelChange={(newModel) => setModel(newModel as typeof model)}
            />

            <Button
              size="icon"
              className={cn(
                "h-9 w-9 shrink-0 rounded-full transition-all duration-300",
                content.trim()
                  ? "bg-[#c9a84c] text-[#0f0d1a] hover:bg-[#c9a84c]/90 shadow-[0_0_20px_rgba(201,168,76,0.2)]"
                  : "bg-white/5 text-muted-foreground/20"
              )}
              onClick={() => handleSubmit()}
              disabled={!content.trim() || isSubmitting}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Suggestion Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full mt-12">
        {SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            onClick={() => handleSubmit(s.label)}
            disabled={isSubmitting}
            style={{ animationDelay: `${i * 50}ms` }}
            className="flex flex-col items-start gap-2 p-4 text-left bg-white/5 border border-[#1e1a2e] hover:border-[#7c3aed]/40 backdrop-blur-md rounded-2xl transition-all duration-300 hover:bg-[#7c3aed]/10 hover:-translate-y-1 animate-fade-up group"
          >
            <s.icon className="h-4 w-4 text-[#c9a84c] group-hover:animate-pulse" />
            <span className="text-[13px] font-medium text-[#f5f0ff]/60 group-hover:text-[#f5f0ff]">
              {s.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
