import { getUser, createSessionClient, createAdminClient } from "@/lib/appwrite/server";
import { COLLECTIONS } from "@/lib/appwrite/config";
import { ID, Query } from "node-appwrite";
import { notFound } from "next/navigation";
import { ChatView } from "@/components/chat/chat-view";
import type { Chat, Message } from "@/lib/appwrite/types";

interface ChatPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ msg?: string; ws?: string }>;
}

export default async function ChatPage({ params, searchParams }: ChatPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const user = await getUser();
  const client = await createSessionClient();

  if (!user || !client) {
    notFound();
  }

  const admin = await createAdminClient();
  const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

  let chatId = resolvedParams.id;
  let isNewChat = false;

  // Handle "New Chat" fast-path
  if (chatId === "new") {
    try {
      const { DEFAULT_MODEL } = await import("@/lib/models");
      const newChat = await admin.databases.createDocument(
        dbId,
        COLLECTIONS.CHATS,
        ID.unique(),
        {
          user_id: user.$id,
          project_id: null,
          title: "New Chat",
          model: DEFAULT_MODEL,
          updatedAt: new Date().toISOString(),
        }
      ) as unknown as Chat;

      chatId = newChat.$id;
      isNewChat = true;
    } catch (err) {
      console.error("[ChatPage] Failed to create new chat:", err);
      notFound();
    }
  }

  // Fetch chat and messages concurrently for faster navigation
  let chatDoc: any;
  let messagesResult: any = { documents: [] };

  if (chatId.startsWith("incognito-")) {
    const { DEFAULT_MODEL } = await import("@/lib/models");
    chatDoc = {
      $id: chatId,
      user_id: user.$id,
      project_id: null,
      title: "Incognito Chat",
      model: DEFAULT_MODEL,
      updatedAt: new Date().toISOString(),
      $collectionId: "",
      $databaseId: "",
      $createdAt: new Date().toISOString(),
      $permissions: []
    };
    isNewChat = true;
  } else {
    try {
      const [chatRes, msgsRes] = await Promise.all([
        admin.databases.getDocument(dbId, COLLECTIONS.CHATS, chatId),
        admin.databases.listDocuments(dbId, COLLECTIONS.MESSAGES, [
          Query.equal("chat_id", chatId),
          Query.orderAsc("$createdAt"),
          Query.limit(100),
        ]),
      ]);
      chatDoc = chatRes as unknown as Chat;
      messagesResult = msgsRes;
    } catch {
      notFound();
    }
  }

  if (chatDoc.user_id !== user.$id) {
    notFound();
  }

  console.log("[DEBUG chat page] Raw messages count:", messagesResult.documents.length);
  console.log("[DEBUG chat page] First doc keys:", messagesResult.documents[0] ? Object.keys(messagesResult.documents[0]) : "none");

  // Pass initial message to client via URL search params state
  const chat: Chat = chatDoc;

  const messages: Message[] = messagesResult.documents as unknown as Message[];

  // Pass initial message from URL to client
  const initialMessage = resolvedSearchParams.msg ? decodeURIComponent(resolvedSearchParams.msg) : null;
  const initialWebSearch = resolvedSearchParams.ws !== '0'; // default true unless explicitly '0'

  // Flag to tell ChatView to process initial message
  const shouldProcessInitial = !!(initialMessage && messages.length === 0);

  // If there's an initial message AND no existing messages, add it to messages
  // Use spread to create new array reference so React detects the change
  let allMessages = messages;
  if (shouldProcessInitial) {
    const initialUserMessage: Message = {
      $id: "initial-" + Date.now(),
      $collectionId: "",
      $databaseId: "",
      $createdAt: new Date().toISOString(),
      $updatedAt: new Date().toISOString(),
      $permissions: [],
      chat_id: resolvedParams.id,
      role: "user",
      content: initialMessage,
    };
    allMessages = [...messages, initialUserMessage];
  }

  return <ChatView chat={chat} initialMessages={allMessages} processInitial={shouldProcessInitial} initialWebSearch={initialWebSearch} isNewChat={isNewChat} />;
}