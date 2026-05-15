import type { Models } from "node-appwrite";

// Base document type from Appwrite
export type AppwriteDocument = Models.Document;

export interface Project extends AppwriteDocument {
  user_id: string;
  name: string;
  description: string | null;
  instructions: string | null;
  isPinned: boolean;
}

export interface Chat extends AppwriteDocument {
  user_id: string;
  project_id: string | null;
  title: string;
  model: string;
  isPinned: boolean;
}

export interface Message extends AppwriteDocument {
  chat_id: string;
  role: "user" | "assistant";
  content: string;
  model?: string;
}

export interface FileRecord extends AppwriteDocument {
  user_id: string;
  chat_id: string | null;
  project_id: string | null;
  file_id: string;
  name: string;
  storagePath: string;
  mimeType: string | null;
  sizeBytes: number | null;
  content: string | null;
}
