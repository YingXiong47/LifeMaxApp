import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { onboardingDraftRequestSchema } from "@/lib/api/schemas";
import { getAuthSummary } from "@/lib/auth/session";
import { getOnboardingDraft, persistOnboardingDraft } from "@/lib/repositories/lifemax";

export async function GET(request: NextRequest) {
  const authSummary = await getAuthSummary();
  const ownerKey = request.nextUrl.searchParams.get("ownerKey") || authSummary.userId;

  if (!ownerKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "An onboarding owner key is required."
      },
      { status: 400 }
    );
  }

  const draft = await getOnboardingDraft(ownerKey);

  return NextResponse.json({
    ok: true,
    draft
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = onboardingDraftRequestSchema.parse(body);
    const result = await persistOnboardingDraft(parsed);

    return NextResponse.json({
      ok: true,
      persistence: result
    });
  } catch (error) {
    const message =
      error instanceof ZodError
        ? error.issues[0]?.message || "Invalid onboarding payload."
        : error instanceof Error
          ? error.message
          : "Unable to save onboarding draft.";

    return NextResponse.json(
      {
        ok: false,
        error: message
      },
      { status: 400 }
    );
  }
}
