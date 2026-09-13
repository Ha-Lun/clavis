"use client";

import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChat } from "@/context/chat-context";
import { MODELS, getModelInfo } from "@/lib/models";
import { ModelIcon } from "./model-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ModelSelectorProps {
  chatId?: string;
  currentModel?: string;
  className?: string;
  onModelChange?: (model: string) => void;
}

export function ModelSelector({
  chatId,
  currentModel,
  className,
  onModelChange,
}: ModelSelectorProps) {
  const { updateChatModel } = useChat();

  const activeModelId = currentModel || "auto";
  const activeModelInfo = getModelInfo(activeModelId);

  const handleSelect = async (modelId: string) => {
    if (onModelChange) {
      onModelChange(modelId);
    }
    if (chatId) {
      updateChatModel(chatId, modelId);
      try {
        await fetch(`/api/chats/${chatId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: modelId }),
        });
      } catch (err) {
        console.error("Failed to update model", err);
      }
    }
  };

  return (
    <div className={cn("flex items-center", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div
            className={cn(
              "h-7 flex items-center gap-1.5 px-2.5",
              "text-[11px] font-medium text-foreground/80 hover:text-foreground",
              "border border-border/80 bg-background/50 hover:bg-accent/40",
              "rounded-full transition-colors duration-150 cursor-pointer shadow-sm"
            )}
          >
            <ModelIcon modelId={activeModelId} size={14} className="text-primary/70" />
            <span>{activeModelInfo.shortName}</span>
            <ChevronDown className="size-3 text-muted-foreground ml-0.5" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          side="top"
          className="min-w-[200px] p-1 border-border/80 bg-popover/95 backdrop-blur-md shadow-xl"
        >
          {MODELS.map((model) => (
            <DropdownMenuItem
              key={model.id}
              onClick={() => handleSelect(model.id)}
              className="flex items-center justify-between cursor-pointer text-[13px] py-1.5 px-2"
            >
              <div className="flex items-center gap-2">
                <ModelIcon modelId={model.id} size={14} />
                <span>{model.name}</span>
              </div>
              {activeModelId === model.id && (
                <Check className="size-3.5 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}