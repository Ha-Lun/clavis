import { getUser, createSessionClient, createAdminClient } from "@/lib/appwrite/server";
import { COLLECTIONS } from "@/lib/appwrite/config";
import { Query } from "node-appwrite";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FolderOpen, ArrowLeft } from "lucide-react";
import { ProjectTabs } from "@/components/project/project-tabs";
import type { Chat, Project } from "@/lib/appwrite/types";

interface ProjectDetailPageProps {
  params: { id: string };
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const user = await getUser();
  const client = await createSessionClient();

  if (!user || !client) notFound();

  const admin = await createAdminClient();
  const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

  let project;
  let chatsResult;

  try {
    const [projectRes, chatsRes] = await Promise.all([
      admin.databases.getDocument(dbId, COLLECTIONS.PROJECTS, params.id),
      admin.databases.listDocuments(dbId, COLLECTIONS.CHATS, [
        Query.equal("project_id", params.id),
        Query.equal("user_id", user.$id),
        Query.orderDesc("$updatedAt"),
        Query.limit(50),
      ]),
    ]);
    project = projectRes as unknown as Project;
    chatsResult = chatsRes;
  } catch {
    notFound();
  }

  if (project.user_id !== user.$id) notFound();

  const chats = chatsResult.documents as unknown as Chat[];

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-6 lg:p-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-primary transition-colors mb-6 font-medium"
        >
          <ArrowLeft className="size-4" />
          All Projects
        </Link>

        <div className="flex items-center gap-4 mb-10">
          <div className="size-12 rounded-[12px] bg-primary/10 flex items-center justify-center shadow-stripe-ambient">
            <FolderOpen className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-light tracking-tight text-foreground">{project.name as string}</h1>
            {project.description && (
              <p className="text-muted-foreground font-light text-[15px] mt-1">
                {project.description as string}
              </p>
            )}
          </div>
        </div>

        <ProjectTabs project={project as unknown as Project} chats={chats} />
      </div>
    </div>
  );
}
