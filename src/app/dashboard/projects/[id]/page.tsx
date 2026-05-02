import { getUser, createSessionClient, createAdminClient } from "@/lib/appwrite/server";
import { COLLECTIONS } from "@/lib/appwrite/config";
import { Query } from "node-appwrite";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, MessageSquare, ArrowLeft } from "lucide-react";
import { getModelInfo } from "@/lib/models";

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
  try {
    project = await admin.databases.getDocument(
      dbId,
      COLLECTIONS.PROJECTS,
      params.id
    );
  } catch {
    notFound();
  }

  if (project.user_id !== user.$id) notFound();

  const chatsResult = await admin.databases.listDocuments(
    dbId,
    COLLECTIONS.CHATS,
    [
      Query.equal("project_id", params.id),
      Query.equal("user_id", user.$id),
      Query.orderDesc("$updatedAt"),
      Query.limit(50),
    ]
  );

  const chats = chatsResult.documents;

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          All Projects
        </Link>

        <div className="flex items-start gap-3 mb-8">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FolderOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{project.name as string}</h1>
            {project.description && (
              <p className="text-muted-foreground text-sm mt-1">
                {project.description as string}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Chats in this project</h2>
        </div>

        {chats.length === 0 ? (
          <div className="text-center py-12 animate-fade-in">
            <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              No chats assigned to this project yet
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {chats.map((chat) => {
              const model = getModelInfo(chat.model as string);
              return (
                <Link
                  key={chat.$id}
                  href={`/dashboard/chat/${chat.$id}`}
                  className="group"
                >
                  <Card className="h-full hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base line-clamp-1 group-hover:text-primary transition-colors">
                          {chat.title as string}
                        </CardTitle>
                        <Badge
                          variant="secondary"
                          className="text-[10px] shrink-0"
                        >
                          {model.shortName}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">
                        {new Date(chat.$updatedAt as string).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
