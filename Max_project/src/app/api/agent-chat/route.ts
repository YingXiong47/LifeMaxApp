import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { agentConversationRequestSchema } from "@/lib/api/schemas";
import { runInteractiveAgentChat } from "@/lib/agents/openai/agent-chat";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = agentConversationRequestSchema.parse(body);
    const result = await runInteractiveAgentChat(parsed);

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof ZodError
        ? error.issues[0]?.message || "Invalid agent chat request."
        : error instanceof Error
          ? error.message
          : "Agent chat failed.";

    return NextResponse.json(
      {
        error: message
      },
      { status: 400 }
    );
  }
}
