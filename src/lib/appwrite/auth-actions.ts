"use server";

import { createAdminClient } from "./server";
import { SESSION_COOKIE } from "./config";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ID } from "node-appwrite";

function setSessionCookie(cookieStore: any, sessionSecret: string, sessionExpire: string) {
  const isSecure = process.env.NODE_ENV === "production" || process.env.FORCE_SECURE_COOKIES === "true";
  cookieStore.set(SESSION_COOKIE, sessionSecret, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "strict",
    expires: new Date(sessionExpire),
    path: "/",
  });
}

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    const { account } = await createAdminClient();
    const session = await account.createEmailPasswordSession(email, password);

    const cookieStore = await cookies();
    setSessionCookie(cookieStore, session.secret, session.expire);
  } catch (err: unknown) {
    const error = err as { message?: string; type?: string };
    if (error.type === "user_invalid_credentials") {
      return { error: "Invalid email or password" };
    }
    return { error: error.message ?? "Login failed" };
  }

  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  try {
    const { account } = await createAdminClient();

    // Create the user
    await account.create(ID.unique(), email, password);

    // Create a session
    const session = await account.createEmailPasswordSession(email, password);

    const cookieStore = await cookies();
    setSessionCookie(cookieStore, session.secret, session.expire);
  } catch (err: unknown) {
    const error = err as { message?: string; type?: string };
    if (error.type === "user_already_exists") {
      return { error: "An account with this email already exists" };
    }
    return { error: error.message ?? "Signup failed" };
  }

  redirect("/dashboard");
}

export async function logout() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE);

    if (session) {
      // Import here to avoid circular dependency
      const { createSessionClient } = await import("./server");
      const client = await createSessionClient();
      if (client) {
        await client.account.deleteSession("current");
      }
    }

    cookieStore.delete(SESSION_COOKIE);
  } catch {
    // Session may already be expired, just clear the cookie
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
  }

  redirect("/login");
}

export async function getOAuthURL(provider: string, clientOrigin: string, source?: string) {
  try {
    const { account } = await createAdminClient();
    const computedOrigin = process.env.NEXT_PUBLIC_APP_URL || "https://clavis.lundstromslogiska.se";
    const successUrl = source === "app" ? `${computedOrigin}/api/oauth?source=app` : `${computedOrigin}/api/oauth`;
    const failureUrl = `${computedOrigin}/login?error=oauth_cancelled`;
    
    // createOAuth2Token returns the provider's authorization URL
    // When the user completes login, Appwrite redirects to successUrl with userId and secret
    const url = await account.createOAuth2Token(
      provider as any, 
      successUrl, 
      failureUrl
    );
    return { url };
  } catch (err: unknown) {
    const error = err as { message?: string };
    return { error: error.message ?? "OAuth initialization failed" };
  }
}

export async function loginAsGuest() {
  try {
    const cookieStore = await cookies();
    const existingSession = cookieStore.get(SESSION_COOKIE);
    if (existingSession) {
      try {
        const { createSessionClient } = await import("./server");
        const client = await createSessionClient();
        if (client) {
          await client.account.deleteSession("current");
        }
      } catch (e) {}
      cookieStore.delete(SESSION_COOKIE);
    }

    const { account } = await createAdminClient();
    const session = await account.createAnonymousSession();

    setSessionCookie(cookieStore, session.secret, session.expire);
  } catch (err: unknown) {
    const error = err as { message?: string };
    return { error: error.message ?? "Guest login failed" };
  }

  redirect("/dashboard");
}

