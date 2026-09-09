import { useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Course, CourseSyncJob } from "./types";

interface CourseSyncStatusProps {
  onCoursesLoaded: (courses: Course[]) => void;
  onError?: (message: string | null) => void;
}

const getJobId = (job?: CourseSyncJob) => job?.jobId ?? job?.id;

async function readResponse<T>(response: Response): Promise<T> {
  const type = response.headers.get("content-type") ?? "";
  if (type.includes("application/json")) return response.json() as Promise<T>;
  const message = await response.text();
  throw new Error(message || `Request failed with status ${response.status}`);
}

export function CourseSyncStatus({ onCoursesLoaded, onError }: CourseSyncStatusProps) {
  const [job, setJob] = useState<CourseSyncJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reportError = (message: string | null) => {
    setError(message);
    onError?.(message);
  };

  const loadCourses = async () => {
    const response = await fetch("/api/courses");
    const data = await readResponse<{ courses?: Course[]; error?: string }>(response);
    if (!response.ok) throw new Error(data.error || "Unable to load courses");
    onCoursesLoaded(data.courses ?? []);
  };

  const syncCourses = async (jobId?: string) => {
    setLoading(true);
    reportError(null);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 120_000);
    try {
      const response = await fetch("/api/courses/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobId ? { jobId } : {}),
        signal: controller.signal,
      });
      const data = await readResponse<{ courses?: Course[]; job?: CourseSyncJob; error?: string }>(response);
      if (!response.ok) throw new Error(data.error || `Course sync failed (${response.status})`);
      if (data.courses) onCoursesLoaded(data.courses);
      const nextJob = data.job;
      if (!nextJob) {
        await loadCourses();
        return;
      }
      setJob(nextJob);
      const status = nextJob.status?.toLowerCase();
      if (getJobId(nextJob) && status !== "completed" && status !== "failed") {
        window.setTimeout(() => void syncCourses(getJobId(nextJob)), 1200);
      } else if (status === "failed") {
        reportError(nextJob.error || nextJob.message || "Course sync completed with errors");
        await loadCourses().catch(() => undefined);
      } else if (status === "completed") {
        await loadCourses();
      }
    } catch (syncError) {
      const message = syncError instanceof DOMException && syncError.name === "AbortError"
        ? "Course sync timed out. The course list may still have loaded; try Refresh again."
        : syncError instanceof Error ? syncError.message : "Unable to sync courses";
      reportError(message);
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  };

  const status = job?.status?.toLowerCase();
  const progress = typeof job?.progress === "number" ? Math.min(100, Math.max(0, job.progress)) : undefined;

  return (
    <div className="flex flex-col items-end gap-2">
      <Button type="button" variant="outline" onClick={() => void syncCourses()} disabled={loading} className="gap-2 rounded-lg border-border bg-card">
        {loading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
        {loading ? "Syncing..." : "Load / Refresh courses"}
      </Button>
      {(job || error) && (
        <div className="flex max-w-[300px] items-center gap-2 text-right text-xs text-muted-foreground" aria-live="polite">
          {error || status === "failed" ? <XCircle className="size-3.5 shrink-0 text-red-400" /> : status === "completed" ? <CheckCircle2 className="size-3.5 shrink-0 text-emerald-400" /> : <Loader2 className="size-3.5 shrink-0 animate-spin text-primary" />}
          <span>{error || job?.message || `Course sync ${status || "in progress"}${progress !== undefined ? ` · ${progress}%` : ""}`}</span>
        </div>
      )}
      {progress !== undefined && loading && (
        <div className="h-1 w-40 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}
