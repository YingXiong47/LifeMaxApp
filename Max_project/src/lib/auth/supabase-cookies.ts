export const SUPABASE_ACCESS_COOKIE = "lifemax-sb-access-token";
export const SUPABASE_REFRESH_COOKIE = "lifemax-sb-refresh-token";

export const authCookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/"
};
