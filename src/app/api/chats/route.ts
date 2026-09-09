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
  } catch (err: unknown) {
    const error = err as { message?: string; code?: number; type?: string };
    console.error("[GET /api/chats] Error:", error.message, error.code, error.type);
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
    const { projectId, courseId, model } = body;
    if (projectId && courseId) {
      return NextResponse.json({ error: "A chat cannot belong to both a project and a course" }, { status: 400 });
    }
    const admin = await createAdminClient();
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

    if (courseId) {
      try {
        const course = await admin.databases.getDocument(dbId, COLLECTIONS.COURSES, courseId) as unknown as { user_id: string };
        if (course.user_id !== user.$id) return NextResponse.json({ error: "Course not found" }, { status: 404 });
      } catch {
        return NextResponse.json({ error: "Course not found" }, { status: 404 });
      }
    }

    const chat = await admin.databases.createDocument(
      dbId,
      COLLECTIONS.CHATS,
      ID.unique(),
      {
        user_id: user.$id,
        project_id: projectId || null,
        course_id: courseId || null,
        title: "New Chat",
        model: model || DEFAULT_MODEL,
        updatedAt: new Date().toISOString(),
      }
    );

    return NextResponse.json({ chat }, { status: 201 });
  } catch (err: unknown) {
    const error = err as { message?: string; code?: number; type?: string };
    console.error("[POST /api/chats] Error:", error.message, error.code, error.type);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
