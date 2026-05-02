"use client";

import { useChatStore } from "@/stores/chat-store";
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
  const { activeChat, updateChatModel } = useChatStore();
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
          className="h-8 min-w-[140px] gap-2 px-3 text-[11px] font-medium border border-[#7c3aed]/20 bg-[#0f0d1a]/40 hover:bg-[#7c3aed]/10 backdrop-blur-md text-[#c9a84c] rounded-full transition-all duration-200"
          id="model-selector-trigger"
        >
          <ModelIcon modelId={model} className="h-3.5 w-3.5 shrink-0" />
          <SelectValue placeholder="Select model" />
        </SelectTrigger>
        <SelectContent className="bg-[#0f0d1a]/95 backdrop-blur-xl border-[#1e1a2e] text-[#f5f0ff] min-w-[200px]">
          {MODELS.map((m) => (
            <SelectItem 
              key={m.id} 
              value={m.id} 
              className="text-xs hover:bg-[#7c3aed]/10 focus:bg-[#7c3aed]/10 rounded-lg py-2 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ModelIcon modelId={m.id} className="h-3.5 w-3.5 opacity-80" />
                <span>{m.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
