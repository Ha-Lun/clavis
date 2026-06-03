import { Skeleton } from "@/components/ui/skeleton";

export function ChatListSkeleton() {
  return (
    <div className="space-y-1 px-2 py-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 px-2 py-1.5">
          <Skeleton className="size-3.5 rounded shrink-0" />
          <Skeleton className="h-3.5 flex-1 rounded-full" style={{ width: `${55 + (i % 3) * 15}%` }} />
        </div>
      ))}
    </div>
  );
}

export function MessagesSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {[1, 0, 1, 0].map((isUser, i) => (
        <div
          key={i}
          className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
        >
          <div className={`${isUser ? "items-end" : "flex-1 min-w-0"}`}>
            {isUser ? (
              <Skeleton className="h-10 w-48 rounded-2xl rounded-br-sm" />
            ) : (
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-full rounded-full" />
                <Skeleton className="h-3.5 w-[85%] rounded-full" />
                <Skeleton className="h-3.5 w-[70%] rounded-full" />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProjectCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border p-5 space-y-3 bg-card">
          <div className="flex items-center gap-2">
            <Skeleton className="size-4 rounded" />
            <Skeleton className="h-4 w-32 rounded-full" />
          </div>
          <Skeleton className="h-3.5 w-48 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function ProjectHeaderSkeleton() {
  return (
    <div className="flex items-center gap-4 mb-10">
      <Skeleton className="size-12 rounded-[12px]" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 rounded-md" />
        <Skeleton className="h-4 w-72 rounded-md" />
      </div>
    </div>
  );
}
