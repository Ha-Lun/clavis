
export function ChatListSkeleton() {
  return (
    <div className="space-y-2.5 p-2 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] bg-void-elevated/40 border border-glass-border/30">
          <div className="h-4 w-4 rounded-full bg-muted/20 shrink-0" />
          <div className="flex-1 space-y-1.5 min-w-0">
            <div className="h-3.5 w-3/4 rounded bg-muted/25" />
            <div className="h-2.5 w-1/2 rounded bg-muted/15" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MessagesSkeleton() {
  return (
    <div className="space-y-6 p-6 max-w-3xl mx-auto animate-pulse">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className={`flex gap-4.5 ${i % 2 === 0 ? "" : "flex-row-reverse"}`}
        >
          <div className="h-8 w-8 rounded-full shrink-0 bg-muted/25 border border-glass-border/30" />
          <div className="space-y-2 max-w-[70%]">
            <div
              className="h-16 rounded-[16px_16px_4px_16px] bg-muted/15 border border-glass-border/25"
              style={{ width: `${200 + Math.random() * 150}px` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProjectCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass-card p-6 space-y-4 border border-glass-border/40 rounded-luxury-md">
          <div className="flex items-center gap-2.5">
            <div className="h-5 w-5 rounded bg-muted/25 shrink-0" />
            <div className="h-5 w-32 rounded bg-muted/25" />
          </div>
          <div className="h-4 w-48 rounded bg-muted/15" />
        </div>
      ))}
    </div>
  );
}
