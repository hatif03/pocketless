import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { callSessions, people } from "@/db/schema";
import { buildVoiceSystemPrompt } from "@/lib/agent-tools";
import { voiceAgentTools } from "@/lib/pipes/types";
import { verifySessionLink } from "@/lib/session-link";

export async function GET(req: NextRequest) {
  const sessionId = verifySessionLink(req.nextUrl.searchParams.get("k"));
  if (!sessionId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [session] = await db
    .select()
    .from(callSessions)
    .where(eq(callSessions.id, sessionId));

  const keyterms = ["Pocketless"];
  if (session?.personId) {
    const [person] = await db
      .select()
      .from(people)
      .where(eq(people.id, session.personId));
    if (person?.name) keyterms.push(person.name);
    if (person?.aliases) {
      keyterms.push(
        ...person.aliases
          .split(",")
          .map((alias) => alias.trim())
          .filter(Boolean),
      );
    }
  }

  const systemPrompt = await buildVoiceSystemPrompt(sessionId);
  return NextResponse.json({
    sessionId,
    systemPrompt,
    tools: voiceAgentTools,
    keyterms: [...new Set(keyterms)].slice(0, 100),
  });
}
