import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { workspaceStateRequestSchema } from "@/lib/api/schemas";
import { getAuthSummary } from "@/lib/auth/session";
import { loadWorkspaceSnapshot, persistWorkspaceSnapshot } from "@/lib/workspace/repository";

function unauthenticatedResponse() {
  return NextResponse.json(
    {
      error: "A signed-in workspace is required before the app can persist protected data."
    },
    { status: 401 }
  );
}

export async function GET() {
  const authSummary = await getAuthSummary();

  if (!authSummary.userId || !authSummary.user) {
    return unauthenticatedResponse();
  }

  try {
    const snapshot = await loadWorkspaceSnapshot({
      userId: authSummary.userId,
      authMode: authSummary.mode,
      user: authSummary.user
    });

    return NextResponse.json(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load workspace.";

    return NextResponse.json(
      {
        error: message
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const authSummary = await getAuthSummary();

  if (!authSummary.userId || !authSummary.user) {
    return unauthenticatedResponse();
  }

  try {
    const body = await request.json();
    const parsed = workspaceStateRequestSchema.parse(body);
    const snapshot = await persistWorkspaceSnapshot({
      userId: authSummary.userId,
      authMode: authSummary.mode,
      user: authSummary.user,
      state: {
        ...parsed.state,
        session: {
          authenticated: true,
          user: {
            id: authSummary.userId,
            name: authSummary.user.name,
            email: authSummary.user.email,
            mode: authSummary.mode
          }
        }
      }
    });

    return NextResponse.json(snapshot);
  } catch (error) {
    const message =
      error instanceof ZodError
        ? error.issues[0]?.message || "Invalid workspace payload."
        : error instanceof Error
          ? error.message
          : "Unable to save workspace.";

    return NextResponse.json(
      {
        error: message
      },
      { status: 500 }
    );
  }
}
