import { NextRequest, NextResponse } from "next/server";

import { runAgentTool } from "@/lib/agent-tools";
import { verifySessionLink } from "@/lib/session-link";

export async function POST(req: NextRequest) {
  const sessionId = verifySessionLink(req.nextUrl.searchParams.get("k"));
  if (!sessionId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    name?: string;
    arguments?: Record<string, unknown>;
  };

  if (!body.name) {
    return NextResponse.json({ error: "Missing tool name" }, { status: 400 });
  }

  const result = await runAgentTool({
    sessionId,
    name: body.name,
    args: body.arguments ?? {},
  });

  return NextResponse.json({ result });
}
