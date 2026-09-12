"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModelSelectorProps {
  chatId?: string;
  currentModel?: string;
  className?: string;
  onModelChange?: (model: string) => void;
}

export function ModelSelector({ className }: ModelSelectorProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <div
        className={cn(
          "h-7 flex items-center gap-1.5 px-2.5",
          "text-[11px] font-medium text-muted-foreground/80",
          "border border-border bg-transparent",
          "rounded-full transition-all duration-150 cursor-default shadow-sm"
        )}
      >
        <Sparkles className="size-3.5 text-primary/70" />
        <span>Auto</span>
      </div>
    </div>
  );
}