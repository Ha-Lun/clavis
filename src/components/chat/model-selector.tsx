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

interface ModelSelectorProps {
  chatId: string;
  currentModel: string;
}

export function ModelSelector({ chatId, currentModel }: ModelSelectorProps) {
  const { activeChat, updateChatModel } = useChatStore();
  const model = activeChat?.model ?? currentModel;

  const handleModelChange = async (newModel: string) => {
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
    <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1e1a2e]">
      <ModelIcon modelId={model} className="h-4 w-4" />
      <Select value={model} onValueChange={handleModelChange}>
        <SelectTrigger className="w-[220px] h-8 text-xs border border-[#7c3aed]/30 bg-white/5 backdrop-blur-[12px] text-[#c9a84c]" id="model-selector">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-[#0f0d1a]/90 backdrop-blur-[12px] border-[#1e1a2e] text-[#f5f0ff]">
          {MODELS.map((m) => (
            <SelectItem key={m.id} value={m.id} className="text-xs hover:bg-[#7c3aed]/10 focus:bg-[#7c3aed]/10 flex items-center gap-2">
              <div className="flex items-center gap-2">
                <ModelIcon modelId={m.id} className="h-3 w-3 opacity-70" />
                <span>{m.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
