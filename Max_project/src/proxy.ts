import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getAuthMode } from "@/lib/auth/config";
import { readiness } from "@/lib/env";

const isProtectedRoute = createRouteMatcher(["/app(.*)", "/onboarding(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!readiness.clerk || getAuthMode() !== "clerk") {
    return NextResponse.next();
  }

  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/"]
};
