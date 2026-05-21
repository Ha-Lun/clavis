"use client";

import { ThinkingSpinner } from "@/components/ui/thinking-spinner";

interface ThinkingIndicatorProps {
  modelId: string;
}

export function ThinkingIndicator({ modelId: _modelId }: ThinkingIndicatorProps) {
  return (
    <div className="flex items-center gap-2 py-2 px-1 text-primary">
      <ThinkingSpinner />
      <span className="text-[12px] font-medium tracking-wide opacity-80 mt-px">
        Considering…
      </span>
    </div>
  );
}