import type { Models } from "node-appwrite";

export interface CourseRecord extends Models.Document {
  user_id: string;
  external_id: string;
  name: string;
  course_code: string | null;
  term_name: string | null;
  canvas_url: string | null;
  is_active: boolean;
  sync_status: "idle" | "syncing" | "ready" | "partial" | "failed";
  indexed_source_count: number;
  content_fingerprint: string | null;
  last_synced_at: string | null;
  sync_error: string | null;
}

export interface CourseSourceRecord extends Models.Document {
  user_id: string;
  course_id: string;
  external_id: string;
  source_type: string;
  title: string;
  source_url: string | null;
  content_hash: string;
  content: string;
  updated_at: string | null;
  indexed_at: string;
}

export interface CourseChunkRecord extends Models.Document {
  user_id: string;
  course_id: string;
  source_id: string;
  source_hash: string;
  chunk_index: number;
  heading: string | null;
  content: string;
  search_text?: string;
  source_name?: string;
  source_url?: string | null;
}
