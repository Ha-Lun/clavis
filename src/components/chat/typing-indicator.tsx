import { ThinkingSpinner } from "@/components/ui/thinking-spinner";

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-2 px-1 text-muted-foreground/40">
      <ThinkingSpinner />
    </div>
  );
}
