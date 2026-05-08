import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";
import { DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config";
import { NextRequest, NextResponse } from "next/server";
import { Query } from "node-appwrite";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await createSessionClient();
    if (!client) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await client.account.get();
    const admin = await createAdminClient();
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

    const files = await admin.databases.listDocuments(
      dbId,
      COLLECTIONS.FILES,
      [
        Query.equal("project_id", params.id),
        Query.equal("user_id", user.$id),
        Query.orderDesc("$createdAt"),
      ]
    );

    return NextResponse.json({
      files: files.documents.map((doc: any) => ({
        id: doc.$id,
        name: doc.name,
        url: `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID}/files/${doc.file_id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`,
        mimeType: doc.mimeType,
        sizeBytes: doc.sizeBytes,
        createdAt: doc.$createdAt,
      })),
    });
  } catch (err: any) {
    console.error("Project files fetch error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
