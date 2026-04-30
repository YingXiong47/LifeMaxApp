import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { User } from "@supabase/supabase-js";
import { getAuthMode } from "@/lib/auth/config";
import { SUPABASE_ACCESS_COOKIE, SUPABASE_REFRESH_COOKIE } from "@/lib/auth/supabase-cookies";
import type { AuthMode, AuthUser } from "@/lib/auth/types";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export type AuthSummary = {
  mode: AuthMode;
  userId: string | null;
  user: AuthUser | null;
};

function isExpectedDynamicServerUsage(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    (error as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE"
  );
}

export async function getAuthSummary(): Promise<AuthSummary> {
  const authMode = getAuthMode();

  if (authMode === "supabase") {
    return getSupabaseAuthSummary();
  }

  if (authMode !== "clerk") {
    return {
      mode: "demo",
      userId: null,
      user: null
    };
  }

  const { userId } = await auth();

  if (!userId) {
    return {
      mode: "clerk",
      userId: null,
      user: null
    };
  }

  const user = await currentUser();
  const primaryEmail = user?.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)?.emailAddress;

  return {
    mode: "clerk",
    userId,
    user: {
      id: userId,
      name: user?.fullName || user?.firstName || "LifeMax member",
      email: primaryEmail || "No verified email"
    }
  };
}

async function getSupabaseAuthSummary(): Promise<AuthSummary> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(SUPABASE_ACCESS_COOKIE)?.value;
    const refreshToken = cookieStore.get(SUPABASE_REFRESH_COOKIE)?.value;
    const supabase = getServerSupabaseClient();

    if (!accessToken || !supabase) {
      return {
        mode: "supabase",
        userId: null,
        user: null
      };
    }

    let user: User | null = null;

    if (refreshToken) {
      const { data } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      user = data.user ?? data.session?.user ?? null;
    }

    if (!user) {
      const { data } = await supabase.auth.getUser(accessToken);
      user = data.user ?? null;
    }

    if (!user) {
      return {
        mode: "supabase",
        userId: null,
        user: null
      };
    }

    return {
      mode: "supabase",
      userId: user.id,
      user: formatSupabaseUser(user)
    };
  } catch (error) {
    if (!isExpectedDynamicServerUsage(error)) {
      console.error("Unable to resolve Supabase auth summary", error);
    }

    return {
      mode: "supabase",
      userId: null,
      user: null
    };
  }
}

function formatSupabaseUser(user: User): AuthUser {
  const email = user.email || "No verified email";
  const displayName =
    typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim().length > 0
      ? user.user_metadata.full_name
      : email.includes("@")
        ? email.split("@")[0]
        : "LifeMax member";

  return {
    id: user.id,
    name: displayName,
    email
  };
}
