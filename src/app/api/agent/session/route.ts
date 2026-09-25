import { NextRequest, NextResponse } from "next/server";

import { buildKeyterms, buildVoiceSystemPrompt } from "@/lib/agent-tools";
import { voiceAgentTools } from "@/lib/pipes/types";
import { verifySessionLink } from "@/lib/session-link";

export async function GET(req: NextRequest) {
  const sessionId = verifySessionLink(req.nextUrl.searchParams.get("k"));
  if (!sessionId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [systemPrompt, keyterms] = await Promise.all([
    buildVoiceSystemPrompt(sessionId),
    buildKeyterms(sessionId, 100),
  ]);

  return NextResponse.json({
    sessionId,
    systemPrompt,
    tools: voiceAgentTools,
    keyterms,
  });
}
