import { getUser, createAdminClient } from "@/lib/appwrite/server";
import { COLLECTIONS } from "@/lib/appwrite/config";
import { Query } from "node-appwrite";
import { redirect } from "next/navigation";
import { ChatsHistory } from "@/components/chats-history";
import type { Chat } from "@/lib/appwrite/types";

export default async function ChatsPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = await createAdminClient();
  const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

  let chats: Chat[] = [];

  try {
    const chatResult = await admin.databases.listDocuments(dbId, COLLECTIONS.CHATS, [
      Query.equal("user_id", user.$id),
      Query.orderDesc("$updatedAt"),
      Query.limit(100),
    ]);

    chats = chatResult.documents as unknown as Chat[];
  } catch (err: unknown) {
    const error = err as { message?: string; code?: number; type?: string };
    console.error("[ChatsPage] APPWRITE ERROR:", {
      message: error.message,
      code: error.code,
      type: error.type,
    });
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <ChatsHistory chats={chats} />
    </div>
  );
}
