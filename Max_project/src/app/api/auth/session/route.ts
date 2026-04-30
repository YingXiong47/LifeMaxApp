import { NextRequest, NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { authCookieBase, SUPABASE_ACCESS_COOKIE, SUPABASE_REFRESH_COOKIE } from "@/lib/auth/supabase-cookies";
import { getServerSupabaseClient } from "@/lib/supabase/server";

const supabaseSessionRequestSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1).nullable().optional()
});

export async function POST(request: NextRequest) {
  try {
    const supabase = getServerSupabaseClient();

    if (!supabase) {
      return NextResponse.json({ error: "Supabase auth is not configured." }, { status: 503 });
    }

    const body = await request.json();
    const parsed = supabaseSessionRequestSchema.parse(body);
    let accessToken = parsed.accessToken;
    let refreshToken = parsed.refreshToken || null;
    let expiresIn = 60 * 60;

    if (refreshToken) {
      const { data, error } = await supabase.auth.setSession({
        access_token: parsed.accessToken,
        refresh_token: refreshToken
      });

      if (error || !data.user) {
        return NextResponse.json({ error: "Supabase session could not be verified." }, { status: 400 });
      }

      accessToken = data.session?.access_token || accessToken;
      refreshToken = data.session?.refresh_token || refreshToken;
      expiresIn = data.session?.expires_in || expiresIn;
    } else {
      const { data, error } = await supabase.auth.getUser(parsed.accessToken);

      if (error || !data.user) {
        return NextResponse.json({ error: "Supabase session could not be verified." }, { status: 400 });
      }
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SUPABASE_ACCESS_COOKIE, accessToken, {
      ...authCookieBase,
      maxAge: Math.max(expiresIn, 60)
    });

    if (refreshToken) {
      response.cookies.set(SUPABASE_REFRESH_COOKIE, refreshToken, {
        ...authCookieBase,
        maxAge: 60 * 60 * 24 * 30
      });
    }

    return response;
  } catch (error) {
    const message =
      error instanceof ZodError
        ? error.issues[0]?.message || "Invalid session payload."
        : error instanceof Error
          ? error.message
          : "Unable to sync the secure session.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SUPABASE_ACCESS_COOKIE, "", {
    ...authCookieBase,
    maxAge: 0
  });
  response.cookies.set(SUPABASE_REFRESH_COOKIE, "", {
    ...authCookieBase,
    maxAge: 0
  });
  return response;
}
