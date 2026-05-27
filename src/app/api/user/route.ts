import { createSessionClient } from "@/lib/appwrite/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const client = await createSessionClient();
    if (!client) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await client.account.get();
    const prefs = await client.account.getPrefs();

    return NextResponse.json({
      id: user.$id,
      email: user.email,
      name: user.name,
      prefs,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const client = await createSessionClient();
    if (!client) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (body.name !== undefined) {
      await client.account.updateName(body.name);
    }

    if (body.prefs !== undefined) {
      const currentPrefs = await client.account.getPrefs();
      await client.account.updatePrefs({ ...currentPrefs, ...body.prefs });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
