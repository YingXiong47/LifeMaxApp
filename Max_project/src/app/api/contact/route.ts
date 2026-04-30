import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const name = String(formData.get("name") || "");
  const email = String(formData.get("email") || "");
  const message = String(formData.get("message") || "");

  return NextResponse.json(
    {
      accepted: true,
      demo: true,
      message:
        "Contact received by scaffold route. In production, send this to a backend inbox, CRM, or support pipeline.",
      payload: { name, email, message }
    },
    { status: 202 }
  );
}
