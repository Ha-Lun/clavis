export interface Course {
  id: string;
  name: string;
  title?: string;
  description?: string;
  code?: string;
  provider?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface CourseSyncJob {
  id?: string;
  jobId?: string;
  status?: "queued" | "running" | "completed" | "failed" | string;
  progress?: number;
  message?: string;
  error?: string;
  [key: string]: unknown;
}
