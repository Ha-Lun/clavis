import { ProjectHeaderSkeleton, MessagesSkeleton } from "@/components/loading-skeleton";

export default function ProjectLoading() {
  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-6 lg:p-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="w-24 h-4 bg-white/5 rounded mb-6 animate-pulse" />
        
        <ProjectHeaderSkeleton />

        <div className="mt-8 flex gap-6 border-b border-white/5 pb-2">
          <div className="w-16 h-4 bg-white/5 rounded animate-pulse" />
          <div className="w-16 h-4 bg-white/5 rounded animate-pulse" />
        </div>

        <div className="mt-8">
          <MessagesSkeleton />
        </div>
      </div>
    </div>
  );
}
