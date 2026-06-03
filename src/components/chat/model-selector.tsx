"use client";

import { useEffect, useState } from "react";
import { useChat } from "@/context/chat-context";
import { MODELS } from "@/lib/models";
import { Lock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ModelIcon } from "./model-icon";
import { cn } from "@/lib/utils";
import { SubscriptionModal } from "@/components/subscription-modal";

interface ModelSelectorProps {
  chatId?: string;
  currentModel: string;
  className?: string;
  onModelChange?: (model: string) => void;
}

export function ModelSelector({ chatId, currentModel, className, onModelChange }: ModelSelectorProps) {
  const { activeChat, updateChatModel } = useChat();
  const model = activeChat?.model ?? currentModel;
  const [subscriptionTier, setSubscriptionTier] = useState<"free" | "pro">("free");
  const [showSubModal, setShowSubModal] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user");
        if (res.ok) {
          const data = await res.json();
          setSubscriptionTier(data.prefs?.subscriptionTier ?? "free");
        }
      } catch {
        // Silently fail
      }
    };
    fetchUser();
  }, []);

  const handleModelChange = async (newModel: string) => {
    const selectedModelInfo = MODELS.find((m) => m.id === newModel);
    if (selectedModelInfo?.isPremium && subscriptionTier !== "pro") {
      setShowSubModal(true);
      return;
    }

    if (onModelChange) {
      onModelChange(newModel);
      return;
    }

    if (!chatId) return;

    updateChatModel(chatId, newModel);

    try {
      await fetch(`/api/chats/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: newModel }),
      });
    } catch (err) {
      console.error("Failed to update model:", err);
      updateChatModel(chatId, currentModel);
    }
  };

  return (
    <div className={cn("flex items-center", className)}>
      <Select value={model} onValueChange={handleModelChange}>
        <SelectTrigger
          className={cn(
            "h-7 min-w-[100px] sm:min-w-[130px] max-w-[140px] sm:max-w-[180px] gap-1.5 px-2.5 py-0",
            "text-[11px] font-medium text-muted-foreground",
            "border border-border bg-transparent",
            "hover:bg-white/[0.04] hover:text-foreground hover:border-white/[0.10]",
            "rounded-md transition-all duration-150",
            "focus:ring-0 focus:ring-offset-0 focus:border-primary/40",
            "shadow-none cursor-pointer",
            "[&>span]:flex [&>span]:items-center [&>span]:gap-1.5 [&>span]:h-full"
          )}
          id="model-selector-trigger"
        >
          <SelectValue placeholder="Select model" />
        </SelectTrigger>
        <SelectContent
          className={cn(
            "bg-[#0a0a0f]/95 border border-neutral-800/60 backdrop-blur-xl",
            "w-[280px] sm:w-[480px] max-h-[520px] rounded-xl shadow-2xl shadow-black/80 animate-in fade-in-50 duration-200",
            "overflow-hidden p-0"
          )}
        >
          <div className="grid grid-cols-1 sm:grid-cols-[1.1fr_0.9fr] divide-y sm:divide-y-0 sm:divide-x divide-neutral-800/50">
            {/* Standard Models Column */}
            <div className="p-2 space-y-1">
              <div className="text-[10px] font-semibold text-neutral-400/60 tracking-wider uppercase px-2.5 py-1.5 mb-1">
                Standard Models
              </div>
              <div className="space-y-0.5">
                {MODELS.filter((m) => !m.isPremium).map((m) => {
                  const isLocked = m.isPremium && subscriptionTier !== "pro";
                  return (
                    <SelectItem
                      key={m.id}
                      value={m.id}
                      disabled={isLocked}
                      className={cn(
                        "text-[12px] font-light pl-8 pr-2.5 py-1.5 rounded-md transition-colors w-full cursor-pointer",
                        isLocked 
                          ? "text-muted-foreground/30 cursor-not-allowed" 
                          : "text-muted-foreground hover:bg-white/[0.04] focus:bg-white/[0.04] focus:text-foreground"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="inline-flex items-center gap-2">
                          <ModelIcon modelId={m.id} className="size-3.5 opacity-60" />
                          <span>{m.name}</span>
                        </span>
                        {isLocked && (
                          <Lock className="size-3 ml-2 text-muted-foreground/30" />
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </div>
            </div>

            {/* Premium Models Column */}
            <div className="p-2 bg-gradient-to-b from-[#c9a84c]/[0.02] to-transparent space-y-1">
              <div className="text-[10px] font-semibold text-[#c9a84c] tracking-wider uppercase px-2.5 py-1.5 mb-1 flex items-center justify-between">
                <span>Premium Models</span>
                <span className="text-[8px] bg-[#c9a84c]/10 text-[#c9a84c] border border-[#c9a84c]/20 rounded px-1.5 py-0.5 font-normal uppercase tracking-normal">
                  Pro
                </span>
              </div>
              <div className="space-y-0.5">
                {MODELS.filter((m) => m.isPremium).map((m) => {
                  const isLocked = m.isPremium && subscriptionTier !== "pro";
                  return (
                    <SelectItem
                      key={m.id}
                      value={m.id}
                      className={cn(
                        "text-[12px] font-light pl-8 pr-2.5 py-1.5 rounded-md transition-colors w-full cursor-pointer",
                        isLocked 
                          ? "text-muted-foreground/45 hover:bg-white/[0.04] focus:bg-white/[0.04]" 
                          : "text-muted-foreground hover:bg-white/[0.04] focus:bg-white/[0.04] focus:text-foreground"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="inline-flex items-center gap-2">
                          <ModelIcon modelId={m.id} className="size-3.5 opacity-60" />
                          <span>{m.name}</span>
                        </span>
                        {isLocked && (
                          <Lock className="size-3 ml-2 text-muted-foreground/30" />
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </div>
            </div>
          </div>
        </SelectContent>
      </Select>
      
      <SubscriptionModal 
        isOpen={showSubModal} 
        onClose={() => setShowSubModal(false)} 
      />
    </div>
  );
}
