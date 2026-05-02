import { createSessionClient, createAdminClient } from "@/lib/appwrite/server";
import { DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config";
import { NextRequest, NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { DEFAULT_MODEL } from "@/lib/models";

export async function GET() {
  try {
    const client = await createSessionClient();
    if (!client) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await client.account.get();
    const admin = await createAdminClient();
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

    const result = await admin.databases.listDocuments(
      dbId,
      COLLECTIONS.CHATS,
      [
        Query.equal("user_id", user.$id),
        Query.orderDesc("$updatedAt"),
        Query.limit(50),
      ]
    );

    return NextResponse.json({ chats: result.documents });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = await createSessionClient();
    if (!client) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await client.account.get();
    const body = await request.json();
    const { projectId, model } = body;
    const admin = await createAdminClient();
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

    const chat = await admin.databases.createDocument(
      dbId,
      COLLECTIONS.CHATS,
      ID.unique(),
      {
        user_id: user.$id,
        project_id: projectId || null,
        title: "New Chat",
        model: model || DEFAULT_MODEL,
      }
    );

    return NextResponse.json({ chat }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
