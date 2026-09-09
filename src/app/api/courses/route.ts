import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { createSessionClient, createAdminClient } from "@/lib/appwrite/server";
import { COLLECTIONS, DATABASE_ID } from "@/lib/appwrite/config";
import type { CourseRecord } from "@/lib/courses/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await createSessionClient();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await session.account.get();
    const admin = await createAdminClient();
    const result = await admin.databases.listDocuments(DATABASE_ID, COLLECTIONS.COURSES, [
      Query.equal("user_id", user.$id),
      Query.orderAsc("name"),
      Query.limit(100),
    ]);
    const courses = (result.documents as unknown as CourseRecord[]).map((course) => ({
      id: course.$id,
      name: course.name,
      code: course.course_code,
      provider: "canvas",
      updatedAt: course.last_synced_at,
      syncStatus: course.sync_status,
      indexedSourceCount: course.indexed_source_count,
      lastSyncedAt: course.last_synced_at,
      canvasUrl: course.canvas_url,
    }));
    return NextResponse.json({ courses });
  } catch (error: any) {
    console.error("[GET /api/courses]", error?.message);
    return NextResponse.json({ error: "Courses are not configured yet. Run the Appwrite course schema migration." }, { status: 503 });
  }
}
