import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/appwrite/config";
import { cookies } from "next/headers";
import { redeemTicket } from "@/lib/auth-tickets";
import { Client, Account } from "node-appwrite";

export async function POST(request: NextRequest) {
  try {
    const { ticket } = await request.json();

    if (!ticket) {
      return NextResponse.json({ error: "Missing ticket" }, { status: 400 });
    }

    const sessionData = redeemTicket(ticket);
    if (!sessionData) {
      return NextResponse.json({ error: "Invalid or expired ticket" }, { status: 401 });
    }

    // Verify session token against Appwrite
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID as string)
      .setSession(sessionData.secret);
      
    const account = new Account(client);
    
    try {
      await account.get();
    } catch {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, sessionData.secret, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      expires: new Date(sessionData.expires),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to set session" }, { status: 500 });
  }
}
