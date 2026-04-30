import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { inngest } from "@/lib/inngest/client";
import { planGenerateRequestSchema } from "@/lib/api/schemas";
import { getAuthSummary } from "@/lib/auth/session";
import { readiness } from "@/lib/env";
import { executePlanGeneration } from "@/lib/workflows/generate-plan";

export async function POST(request: NextRequest) {
  try {
    const authSummary = await getAuthSummary();
    const body = await request.json();
    const parsed = planGenerateRequestSchema.parse(body);
    const dispatchMode = request.nextUrl.searchParams.get("dispatch");

    if (dispatchMode === "async" && readiness.inngest) {
      await inngest.send({
        name: "lifemax/plan.requested",
        data: parsed
      });

      return NextResponse.json({
        queued: true
      });
    }

    const result = await executePlanGeneration({
      ownerKey: parsed.ownerKey,
      authMode: parsed.authMode,
      answers: parsed.answers,
      previousState: parsed.previousState,
      planningMode: parsed.planningMode,
      userId: authSummary.userId,
      user: authSummary.user
    });

    return NextResponse.json({ result });
  } catch (error) {
    const message =
      error instanceof ZodError
        ? error.issues[0]?.message || "Invalid plan request."
        : error instanceof Error
          ? error.message
          : "Plan generation failed.";

    return NextResponse.json(
      {
        error: message
      },
      { status: 400 }
    );
  }
}
