import { getUser, createSessionClient, createAdminClient } from "@/lib/appwrite/server";
import { COLLECTIONS } from "@/lib/appwrite/config";
import { Query } from "node-appwrite";
import { redirect } from "next/navigation";
import { SidebarProvider } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { CreateProjectDialog } from "@/components/project/create-project-dialog";
import type { Chat, Project } from "@/lib/appwrite/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const client = await createSessionClient();
  if (!client) {
    redirect("/login");
  }

  // Fetch initial data for sidebar
  const admin = await createAdminClient();
  const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

  // DEBUG: log what values the server is actually using
  console.log("[DEBUG] APPWRITE ENV CHECK:", {
    endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
    projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
    databaseId: dbId,
    apiKeySet: !!process.env.APPWRITE_API_KEY,
    apiKeyLen: process.env.APPWRITE_API_KEY?.length,
  });

  let chats: Chat[] = [];
  let projects: Project[] = [];

  try {
    const [chatsResult, projectsResult] = await Promise.all([
      admin.databases.listDocuments(dbId, COLLECTIONS.CHATS, [
        Query.equal("user_id", user.$id),
        Query.orderDesc("$updatedAt"),
        Query.limit(20),
      ]),
      admin.databases.listDocuments(dbId, COLLECTIONS.PROJECTS, [
        Query.equal("user_id", user.$id),
        Query.orderDesc("$createdAt"),
        Query.limit(50),
      ]),
    ]);

    chats = chatsResult.documents.map((doc) => ({
      ...doc,
      id: doc.$id,
      created_at: doc.$createdAt,
      updated_at: doc.$updatedAt,
    })) as unknown as Chat[];

    projects = projectsResult.documents.map((doc) => ({
      ...doc,
      id: doc.$id,
      created_at: doc.$createdAt,
    })) as unknown as Project[];
  } catch (err: unknown) {
    const error = err as { message?: string; code?: number; type?: string };
    console.error("[DEBUG] APPWRITE ERROR:", {
      message: error.message,
      code: error.code,
      type: error.type,
    });
    // Continue with empty arrays — don't crash the whole layout
  }

  return (
    <div className="h-screen flex overflow-hidden animate-fade-in bg-background">
      <SidebarProvider
        initialChats={chats}
        initialProjects={projects}
        userEmail={user.email}
        userId={user.$id}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileNav />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
      <CreateProjectDialog />
    </div>
  );
}
