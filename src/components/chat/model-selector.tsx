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
            "h-7 min-w-[130px] max-w-[180px] gap-1.5 px-2.5",
            "text-[11px] font-medium text-muted-foreground",
            "border border-border bg-transparent",
            "hover:bg-white/[0.04] hover:text-foreground hover:border-white/[0.10]",
            "rounded-md transition-all duration-150",
            "focus:ring-0 focus:ring-offset-0 focus:border-primary/40",
            "shadow-none cursor-pointer"
          )}
          id="model-selector-trigger"
        >
          <SelectValue placeholder="Select model" />
        </SelectTrigger>
        <SelectContent
          className={cn(
            "bg-popover border-border",
            "min-w-[200px] rounded-lg shadow-md-dark",
            "overflow-hidden"
          )}
        >
          {MODELS.map((m) => (
            <SelectItem
              key={m.id}
              value={m.id}
              className={cn(
                "text-[13px] font-light text-muted-foreground",
                "hover:bg-white/[0.04] focus:bg-white/[0.04] focus:text-foreground",
                "rounded-md py-2 transition-colors cursor-pointer"
              )}
            >
              <span className="inline-flex items-center gap-2">
                <ModelIcon modelId={m.id} className="h-3.5 w-3.5 opacity-60" />
                <span>{m.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
