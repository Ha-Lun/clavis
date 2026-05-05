"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@/context/chat-context";
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
  const { chats, setChats } = useChat();

  const handleSubmit = async (text: string = content) => {
    if (!text.trim() || isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Step 1: Create the chat
      const createRes = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model }),
      });
      const { chat } = await createRes.json();
      
      if (!chat) {
        throw new Error("Failed to create chat");
      }
      
      const chatId = chat.$id ?? chat.id;
      
      console.log("[HomePrompt] Chat created:", chatId);
      
      // Update chat list
      setChats([chat, ...chats]);
      
      // Step 2: Navigate with message in URL - chat page will handle it
      router.push(`/dashboard/chat/${chatId}?msg=${encodeURIComponent(text.trim())}`);
      
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
    <div className="flex flex-col items-center justify-center h-full w-full max-w-3xl mx-auto px-4 animate-fade-in pb-12">
      {/* Wordmark */}
      <div className="mb-16 text-center">
        <h1 className="text-6xl md:text-[80px] font-light tracking-tighter text-foreground bg-clip-text">
          Flux
        </h1>
      </div>

      {/* Main Input Box */}
      <div className="w-full relative flex flex-col gap-0 bg-card rounded-xl border border-border shadow-stripe-elevated focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary transition-all duration-300">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          rows={3}
          className="w-full resize-none bg-transparent text-[18px] md:text-[20px] font-light leading-relaxed outline-none placeholder:text-muted-foreground/60 pt-6 px-6 pb-2 scrollbar-thin text-foreground"
          disabled={isSubmitting}
        />
        
        {/* Bottom Bar */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10"
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
                "h-9 w-9 shrink-0 rounded-md transition-all duration-300",
                content.trim()
                  ? "bg-primary text-white hover:bg-primary/90 shadow-[0_2px_8px_rgba(83,58,253,0.3)]"
                  : "bg-secondary text-muted-foreground"
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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full mt-16">
        {SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            onClick={() => handleSubmit(s.label)}
            disabled={isSubmitting}
            style={{ animationDelay: `${i * 50}ms` }}
            className="flex flex-col items-start gap-3 p-5 text-left bg-card border border-border rounded-[12px] transition-all duration-300 hover:border-primary/50 shadow-stripe-ambient hover:shadow-stripe-elevated hover:-translate-y-1 animate-fade-up group"
          >
            <s.icon className="h-5 w-5 text-primary opacity-80 group-hover:opacity-100 group-hover:animate-pulse" />
            <span className="text-[15px] font-light text-foreground">
              {s.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
