import { NextRequest, NextResponse } from "next/server";

import { mintVoiceAgentToken } from "@/lib/assemblyai/voice-token";
import { verifySessionLink } from "@/lib/session-link";

export async function GET(req: NextRequest) {
  const sessionId = verifySessionLink(req.nextUrl.searchParams.get("k"));
  if (!sessionId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const token = await mintVoiceAgentToken();
    return NextResponse.json({ token, sessionId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Token failed" },
      { status: 500 },
    );
  }
}
