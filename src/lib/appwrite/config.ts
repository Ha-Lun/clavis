// Appwrite Database & Collection IDs
// These must match what's created via the setup script or Appwrite Console

export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "69f62a80001dafec8332";

export const COLLECTIONS = {
  PROJECTS: "projects",
  CHATS: "chats",
  MESSAGES: "messages",
  FILES: "files",
} as const;

export const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || "flux-uploads";

// Cookie name for Appwrite session
export const SESSION_COOKIE = "appwrite-session";
