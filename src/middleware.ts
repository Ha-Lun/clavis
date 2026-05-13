import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/appwrite/config";

export async function middleware(request: NextRequest) {
  const session = request.cookies.get(SESSION_COOKIE);
  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");

  // Basic presence check in middleware (Node.js Appwrite SDK is not supported in Edge runtime)
  const hasSessionCookie = !!session?.value;

  // Protect dashboard routes
  if (isDashboard && !hasSessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // NOTE: We do not automatically redirect away from /login or /signup here.
  // Doing so can cause infinite redirect loops if the cookie exists but the session
  // is invalid on the server components. The server components or client-side logic
  // will handle redirecting authenticated users away from auth pages.

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
