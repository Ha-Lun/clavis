import { ProjectCardsSkeleton } from "@/components/loading-skeleton";

export default function ProjectsLoading() {
  return (
    <div className="h-full overflow-y-auto p-6 lg:p-8 max-w-7xl mx-auto w-full animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-1 font-light">Organize your chats into workspaces</p>
        </div>
      </div>
      <ProjectCardsSkeleton />
    </div>
  );
}