import { Zap } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="h-full flex items-center justify-center p-6 lg:p-8 animate-fade-in">
      <div className="flex flex-col items-center justify-center gap-4 animate-pulse">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Zap className="h-6 w-6 text-primary" />
        </div>
      </div>
    </div>
  );
}