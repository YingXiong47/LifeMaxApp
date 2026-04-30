import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { workspaceDeleteRequestSchema } from "@/lib/api/schemas";
import { getAuthSummary } from "@/lib/auth/session";
import { deleteSupabaseAccount, deleteWorkspaceData } from "@/lib/workspace/repository";

function unauthenticatedResponse() {
  return NextResponse.json(
    {
      error: "A signed-in account is required before protected account actions can run."
    },
    { status: 401 }
  );
}

export async function DELETE(request: NextRequest) {
  const authSummary = await getAuthSummary();

  if (!authSummary.userId || !authSummary.user) {
    return unauthenticatedResponse();
  }

  if (authSummary.mode !== "supabase") {
    return NextResponse.json(
      {
        error: "This account management action is only available for Supabase-authenticated users."
      },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const parsed = workspaceDeleteRequestSchema.parse(body);

    if (parsed.target === "profile") {
      const result = await deleteWorkspaceData({
        userId: authSummary.userId,
        ownerKey: authSummary.userId,
        includeSettings: false
      });

      return NextResponse.json({
        ok: true,
        target: "profile",
        deletedTables: result.deletedTables
      });
    }

    const result = await deleteSupabaseAccount({
      userId: authSummary.userId,
      ownerKey: authSummary.userId
    });

    return NextResponse.json({
      ok: true,
      target: "account",
      deletedTables: result.deletedTables
    });
  } catch (error) {
    const message =
      error instanceof ZodError
        ? error.issues[0]?.message || "Invalid account deletion request."
        : error instanceof Error
          ? error.message
          : "Unable to complete the account action.";

    return NextResponse.json(
      {
        error: message
      },
      { status: 500 }
    );
  }
}
