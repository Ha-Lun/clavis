"use server";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite/server";
import { SESSION_COOKIE } from "@/lib/appwrite/config";
import { cookies } from "next/headers";
import { storeTicket } from "@/lib/auth-tickets";

/**
 * OAuth callback handler.
 * After Appwrite redirects the user back from the OAuth provider,
 * the Appwrite SDK automatically sets a session on the client.
 * This route exchanges the userId + secret query params for a
 * server-side session cookie.
 */
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  const secret = request.nextUrl.searchParams.get("secret");
  const source = request.nextUrl.searchParams.get("source");

  if (!userId || !secret) {
    return NextResponse.redirect(
      new URL("/login?error=oauth_failed", request.url)
    );
  }

  try {
    const { account } = await createAdminClient();
    const session = await account.createSession(userId, secret);

    if (source === "app") {
      const ticket = storeTicket(session.secret, session.expire);
      const redirectUrl = `clavis://oauth?ticket=${encodeURIComponent(ticket)}`;
      
      const response = new NextResponse(
        `<html>
          <head><meta http-equiv="refresh" content="0;url=${redirectUrl}" /></head>
          <body>
            <script>window.location.href = "${redirectUrl}";</script>
            <p>Redirecting back to Clavis...</p>
          </body>
        </html>`,
        { headers: { "Content-Type": "text/html" } }
      );
      
      response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
      return response;
    }

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, session.secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(session.expire),
      path: "/",
    });

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch {
    return NextResponse.redirect(
      new URL("/login?error=oauth_failed", request.url)
    );
  }
}
