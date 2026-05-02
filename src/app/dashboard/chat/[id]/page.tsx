import { getUser, createSessionClient, createAdminClient } from "@/lib/appwrite/server";
import { COLLECTIONS } from "@/lib/appwrite/config";
import { Query } from "node-appwrite";
import { notFound } from "next/navigation";
import { ChatView } from "@/components/chat/chat-view";
import type { Chat, Message } from "@/lib/appwrite/types";

interface ChatPageProps {
  params: { id: string };
}

export default async function ChatPage({ params }: ChatPageProps) {
  const user = await getUser();
  const client = await createSessionClient();

  if (!user || !client) {
    notFound();
  }

  const admin = await createAdminClient();
  const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

  // Fetch chat
  let chatDoc;
  try {
    chatDoc = await admin.databases.getDocument(
      dbId,
      COLLECTIONS.CHATS,
      params.id
    );
  } catch {
    notFound();
  }

  if (chatDoc.user_id !== user.$id) {
    notFound();
  }

  // Fetch messages
  const messagesResult = await admin.databases.listDocuments(
    dbId,
    COLLECTIONS.MESSAGES,
    [
      Query.equal("chat_id", params.id),
      Query.orderAsc("$createdAt"),
      Query.limit(100),
    ]
  );

  // Map to our types
  const chat: Chat = {
    ...chatDoc,
    id: chatDoc.$id,
    created_at: chatDoc.$createdAt,
    updated_at: chatDoc.$updatedAt,
  } as unknown as Chat;

  const messages: Message[] = messagesResult.documents.map((doc) => ({
    ...doc,
    id: doc.$id,
    chat_id: doc.chat_id,
    created_at: doc.$createdAt,
  })) as unknown as Message[];

  return <ChatView chat={chat} initialMessages={messages} />;
}
