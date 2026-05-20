"use server";

import { createAdminClient } from "@/lib/appwrite/server";
import { COLLECTIONS } from "@/lib/appwrite/config";
import { createNvidiaClient } from "@/lib/nvidia";
import { ID, Query } from "node-appwrite";
import { DEFAULT_MODEL } from "@/lib/models";
import { CLAVIS_SYSTEM_PROMPT } from "@/lib/prompts";
import type { Message } from "@/lib/appwrite/types";



export async function processInitialMessage(chatId: string, message: string, model?: string): Promise<Message[]> {
  console.log("[processInitialMessage] Starting for chat:", chatId, "msg:", message?.slice(0, 30));
  
  const admin = await createAdminClient();
  const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
  const modelId = model || DEFAULT_MODEL;
  
  console.log("[processInitialMessage] Using model:", modelId);
  
  let userMsg: Message | null = null;
  
  try {
    // Save user message
    console.log("[processInitialMessage] Saving user message...");
    const userMsgDoc = await admin.databases.createDocument(
      dbId,
      COLLECTIONS.MESSAGES,
      ID.unique(),
      { chat_id: chatId, role: "user", content: message }
    );
    
    userMsg = {
      $id: userMsgDoc.$id,
      $collectionId: "",
      $databaseId: "",
      $createdAt: userMsgDoc.$createdAt,
      $updatedAt: userMsgDoc.$updatedAt,
      $permissions: [],
      chat_id: chatId,
      role: "user",
      content: message,
    };
    
    console.log("[processInitialMessage] User message saved, calling AI...");
    
    // Call AI
    const nvidia = createNvidiaClient();
    const completion = await nvidia.chat.completions.create({
      model: modelId,
      messages: [
        { role: "system", content: CLAVIS_SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
      stream: false,
      max_tokens: 4096,
    });
    
    const aiContent = completion.choices[0]?.message?.content || "⚠️ No response";
    console.log("[processInitialMessage] AI response:", aiContent.slice(0, 50));
    
    // Save AI response
    const aiMsgDoc = await admin.databases.createDocument(
      dbId,
      COLLECTIONS.MESSAGES,
      ID.unique(),
      { chat_id: chatId, role: "assistant", content: aiContent + `\n\n<!-- model: ${modelId} -->` }
    );
    
    const aiMsg: Message = {
      $id: aiMsgDoc.$id,
      $collectionId: "",
      $databaseId: "",
      $createdAt: aiMsgDoc.$createdAt,
      $updatedAt: aiMsgDoc.$updatedAt,
      $permissions: [],
      chat_id: chatId,
      role: "assistant",
      content: aiContent,
    };
    
    return [userMsg, aiMsg];
  } catch (err: any) {
    console.error("[processInitialMessage] Error:", err.message);
    
    // Return error message
    const errorMsgDoc = await admin.databases.createDocument(
      dbId,
      COLLECTIONS.MESSAGES,
      ID.unique(),
      { chat_id: chatId, role: "assistant", content: `⚠️ Error: ${err.message}\n\n<!-- model: ${modelId} -->` }
    );
    
    const errorMsg: Message = {
      $id: errorMsgDoc.$id,
      $collectionId: "",
      $databaseId: "",
      $createdAt: errorMsgDoc.$createdAt,
      $updatedAt: errorMsgDoc.$updatedAt,
      $permissions: [],
      chat_id: chatId,
      role: "assistant",
      content: `⚠️ Error: ${err.message}`,
    };
    
    return userMsg ? [userMsg, errorMsg] : [errorMsg];
  }
}