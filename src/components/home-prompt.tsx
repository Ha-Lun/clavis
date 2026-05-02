"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/stores/chat-store";
import { MODELS, DEFAULT_MODEL } from "@/lib/models";
import { ModelIcon } from "@/components/chat/model-icon";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, Sparkles, Code, FileText, Lightbulb, Mail, Bug } from "lucide-react";
import { cn } from "@/lib/utils";

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
        <h1 className="text-6xl md:text-7xl font-bold text-[#c9a84c] drop-shadow-[0_0_15px_rgba(201,168,76,0.5)] tracking-wide">
          Flux
        </h1>
      </div>

      {/* Main Input Box */}
      <div className="w-full relative flex flex-col gap-2 bg-white/5 rounded-[32px] border border-[#7c3aed]/30 backdrop-blur-[12px] p-4 focus-within:shadow-[0_0_0_2px_rgba(124,58,237,0.4)] transition-all duration-300">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          rows={3}
          className="w-full resize-none bg-transparent text-lg md:text-xl outline-none placeholder:text-muted-foreground/70 py-2 px-2 scrollbar-thin font-sans"
          disabled={isSubmitting}
        />
        
        {/* Bottom Bar: Model Selector & Send Button */}
        <div className="flex items-center justify-between mt-2 pl-2 pr-1">
          <Select value={model} onValueChange={(value) => setModel(value as typeof model)} disabled={isSubmitting}>
            <SelectTrigger className="w-[180px] md:w-[200px] h-9 text-xs border border-[#7c3aed]/20 bg-[#0f0d1a]/50 hover:bg-[#7c3aed]/10 backdrop-blur-[12px] text-[#c9a84c] rounded-full transition-colors">
              <div className="flex items-center gap-2">
                <ModelIcon modelId={model} className="h-4 w-4" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#0f0d1a]/90 backdrop-blur-[12px] border-[#1e1a2e] text-[#f5f0ff]">
              {MODELS.map((m) => (
                <SelectItem key={m.id} value={m.id} className="text-xs hover:bg-[#7c3aed]/10 focus:bg-[#7c3aed]/10">
                  <div className="flex items-center gap-2">
                    <ModelIcon modelId={m.id} className="h-3 w-3 opacity-70" />
                    <span>{m.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            size="icon"
            className={cn(
              "h-10 w-10 shrink-0 rounded-full transition-all duration-300",
              content.trim()
                ? "bg-[#c9a84c] text-[#0f0d1a] hover:bg-[#c9a84c]/90 shadow-[0_0_15px_rgba(201,168,76,0.3)]"
                : "bg-white/10 text-muted-foreground hover:bg-white/20"
            )}
            onClick={() => handleSubmit()}
            disabled={!content.trim() || isSubmitting}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Suggestion Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full mt-10">
        {SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            onClick={() => handleSubmit(s.label)}
            disabled={isSubmitting}
            style={{ animationDelay: `${i * 50}ms` }}
            className="flex flex-col items-start gap-2 p-4 text-left bg-white/5 border border-[#1e1a2e] hover:border-[#7c3aed]/50 backdrop-blur-md rounded-2xl transition-all duration-300 hover:bg-[#7c3aed]/10 hover:-translate-y-1 animate-fade-up group"
          >
            <s.icon className="h-5 w-5 text-[#c9a84c] group-hover:animate-pulse" />
            <span className="text-sm font-medium text-[#f5f0ff]/80 group-hover:text-[#f5f0ff]">
              {s.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
