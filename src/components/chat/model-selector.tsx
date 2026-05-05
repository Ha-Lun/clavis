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
import { ChevronDown } from "lucide-react";
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
      // Revert on error
      updateChatModel(chatId, currentModel);
    }
  };

  return (
    <div className={cn("flex items-center", className)}>
      <Select value={model} onValueChange={handleModelChange}>
        <SelectTrigger 
          className="h-8 min-w-[140px] gap-2 px-3 text-[12px] font-medium border border-border bg-card hover:bg-secondary text-foreground rounded-[6px] transition-all duration-200 shadow-sm focus:ring-primary focus:border-primary"
          id="model-selector-trigger"
        >
          <SelectValue placeholder="Select model" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border text-foreground min-w-[200px] shadow-stripe-elevated rounded-[8px]">
          {MODELS.map((m) => (
            <SelectItem 
              key={m.id} 
              value={m.id} 
              className="text-[13px] font-light text-muted-foreground hover:bg-primary/5 focus:bg-primary/5 focus:text-foreground rounded-[6px] py-2 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ModelIcon modelId={m.id} className="h-4 w-4 opacity-70" />
                <span>{m.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
