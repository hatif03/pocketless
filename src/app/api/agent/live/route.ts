import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { callSessions } from "@/db/schema";
import { verifySessionLink } from "@/lib/session-link";

export async function POST(req: NextRequest) {
  const sessionId = verifySessionLink(req.nextUrl.searchParams.get("k"));
  if (!sessionId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    liveYou?: string;
    liveThem?: string;
    livePocketless?: string;
    agentStatus?: string;
    participants?: string[];
  };

  await db
    .update(callSessions)
    .set({
      ...(body.liveYou !== undefined ? { liveYou: body.liveYou } : {}),
      ...(body.liveThem !== undefined ? { liveThem: body.liveThem } : {}),
      ...(body.livePocketless !== undefined
        ? { livePocketless: body.livePocketless }
        : {}),
      ...(body.agentStatus !== undefined
        ? { agentStatus: body.agentStatus }
        : {}),
      ...(body.participants
        ? { participantsJson: JSON.stringify(body.participants) }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(callSessions.id, sessionId));

  return NextResponse.json({ ok: true });
}
