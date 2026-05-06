import { MessagesSkeleton } from "@/components/loading-skeleton";

export default function ChatLoading() {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <MessagesSkeleton />
      </div>
    </div>
  );
}