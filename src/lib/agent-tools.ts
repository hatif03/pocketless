import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  callSessions,
  decisions,
  episodes,
  mockOutbox,
  people,
  promises,
} from "@/db/schema";
import { gatewayChat } from "@/lib/assemblyai/gateway";

export async function runAgentTool(input: {
  sessionId: string;
  name: string;
  args: Record<string, unknown>;
}) {
  const [session] = await db
    .select()
    .from(callSessions)
    .where(eq(callSessions.id, input.sessionId));

  if (!session) {
    return { error: "Session not found" };
  }

  const personId = session.personId;
  const label = `${input.name}`;

  await db
    .update(callSessions)
    .set({ lastTool: label, updatedAt: new Date() })
    .where(eq(callSessions.id, session.id));

  if (input.name === "recall_memory") {
    const query = String(input.args.query ?? "");
    if (!personId) {
      return { text: "No person is linked to this session yet." };
    }
    const [person] = await db
      .select()
      .from(people)
      .where(eq(people.id, personId));
    const [open, recent] = await Promise.all([
      db
        .select()
        .from(promises)
        .where(
          and(eq(promises.personId, personId), eq(promises.status, "open")),
        ),
      db
        .select()
        .from(episodes)
        .where(eq(episodes.personId, personId))
        .orderBy(desc(episodes.occurredAt))
        .limit(5),
    ]);
    return {
      person: person?.name,
      brief: person?.relationshipBrief,
      query,
      openPromises: open.map((p) => p.text),
      episodes: recent.map((e) => ({
        title: e.title,
        occurredAt: e.occurredAt,
        brief: e.brief,
        excerpt: e.transcript?.slice(0, 600),
      })),
    };
  }

  if (input.name === "create_promise") {
    if (!personId) {
      return { error: "Link a person before creating a promise." };
    }
    const text = String(input.args.text ?? "").trim();
    if (!text) return { error: "Missing promise text" };
    const [created] = await db
      .insert(promises)
      .values({
        userId: session.userId,
        personId,
        text,
        sourceSessionId: session.id,
      })
      .returning();
    return { ok: true, promise: created.text };
  }

  if (input.name === "list_promises") {
    if (!personId) return { promises: [] };
    const rows = await db
      .select()
      .from(promises)
      .where(eq(promises.personId, personId));
    return {
      promises: rows.map((p) => ({ text: p.text, status: p.status })),
    };
  }

  if (input.name === "draft_email") {
    const payload = {
      to: input.args.to ?? null,
      subject: input.args.subject,
      body: input.args.body,
    };
    await db.insert(mockOutbox).values({
      userId: session.userId,
      kind: "email",
      payload: JSON.stringify(payload),
    });
    return { ok: true, mocked: true, ...payload };
  }

  if (input.name === "hold_calendar") {
    const payload = { title: input.args.title, when: input.args.when };
    await db.insert(mockOutbox).values({
      userId: session.userId,
      kind: "calendar",
      payload: JSON.stringify(payload),
    });
    return { ok: true, mocked: true, ...payload };
  }

  if (input.name === "note_decision") {
    if (!personId) return { error: "No person linked" };
    const text = String(input.args.text ?? "").trim();
    await db.insert(decisions).values({
      userId: session.userId,
      personId,
      text,
      sourceSessionId: session.id,
    });
    return { ok: true, decision: text };
  }

  return { error: `Unknown tool ${input.name}` };
}

export async function buildVoiceSystemPrompt(sessionId: string) {
  const [session] = await db
    .select()
    .from(callSessions)
    .where(eq(callSessions.id, sessionId));
  if (!session) {
    return "You are Pocketless. Stay silent until someone says Pocketless.";
  }

  let memory = "No person is linked.";
  if (session.personId) {
    const [person] = await db
      .select()
      .from(people)
      .where(eq(people.id, session.personId));
    const open = await db
      .select()
      .from(promises)
      .where(
        and(
          eq(promises.personId, session.personId),
          eq(promises.status, "open"),
        ),
      );
    memory = `You are in a Google Meet with ${person?.name ?? "someone"}. Brief: ${person?.relationshipBrief}. Open promises: ${open.map((p) => p.text).join("; ") || "none"}.`;
  }

  return `You are Pocketless, a coworker in a live Google Meet. You are silent by default. Do not greet. Do not speak unless a human addresses you with the wake name Pocketless.
When woken, be brief. Use tools for memory, promises, mock email, and mock calendar instead of inventing facts.
${memory}`;
}

export async function writePostSessionBrief(sessionId: string, transcript: string) {
  const [session] = await db
    .select()
    .from(callSessions)
    .where(eq(callSessions.id, sessionId));
  if (!session?.personId) {
    return;
  }

  const [person] = await db
    .select()
    .from(people)
    .where(eq(people.id, session.personId));

  const raw = await gatewayChat({
    json: true,
    messages: [
      {
        role: "system",
        content: `Summarize this call for a relationship card. Return JSON with keys: brief (string), promises (string array of NEW commitments), topics (comma string). Existing person: ${person?.name}. Prior brief: ${person?.relationshipBrief ?? ""}`,
      },
      { role: "user", content: transcript.slice(0, 24000) },
    ],
  });

  let parsed: { brief?: string; promises?: string[]; topics?: string } = {};
  try {
    parsed = JSON.parse(raw) as typeof parsed;
  } catch {
    parsed = { brief: raw.slice(0, 1200), promises: [], topics: "" };
  }

  const brief = parsed.brief?.trim() || person?.relationshipBrief || raw.slice(0, 800);

  await db.insert(episodes).values({
    userId: session.userId,
    personId: session.personId,
    sessionId: session.id,
    title: `Google Meet with ${person?.name ?? "them"}`,
    brief,
    transcript,
    topics: parsed.topics,
    occurredAt: session.startedAt ?? new Date(),
  });

  await db
    .update(people)
    .set({
      relationshipBrief: brief,
      lastSpokeAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(people.id, session.personId));

  for (const text of parsed.promises ?? []) {
    if (!text.trim()) continue;
    await db.insert(promises).values({
      userId: session.userId,
      personId: session.personId,
      text: text.trim(),
      sourceSessionId: session.id,
    });
  }
}
