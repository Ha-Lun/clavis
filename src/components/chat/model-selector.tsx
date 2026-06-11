"use client";

import { useChat } from "@/context/chat-context";
import { MODELS } from "@/lib/models";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ModelIcon } from "./model-icon";
import { cn } from "@/lib/utils";

interface ModelSelectorProps {
  chatId?: string;
  currentModel: string;
  className?: string;
  onModelChange?: (model: string) => void;
}

export function ModelSelector({ chatId, currentModel, className, onModelChange }: ModelSelectorProps) {
  const { activeChat, updateChatModel } = useChat();
  const model = activeChat?.model ?? currentModel;

  const handleModelChange = async (newModel: string) => {
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
          <div className="p-2 space-y-1">
            <div className="space-y-0.5">
              {MODELS.map((m) => (
                <SelectItem
                  key={m.id}
                  value={m.id}
                  className={cn(
                    "text-[12px] font-light pl-8 pr-2.5 py-1.5 rounded-md transition-colors w-full cursor-pointer",
                    "text-muted-foreground hover:bg-white/[0.04] focus:bg-white/[0.04] focus:text-foreground"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="inline-flex items-center gap-2">
                      <ModelIcon modelId={m.id} className="size-3.5 opacity-60" />
                      <span>{m.name}</span>
                    </span>
                  </div>
                </SelectItem>
              ))}
            </div>
          </div>
        </SelectContent>
      </Select>
    </div>
  );
}