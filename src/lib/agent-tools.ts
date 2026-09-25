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
import type {
  TranscriptEntity,
  TranscriptSentiment,
} from "@/lib/assemblyai/transcribe";
import { indexEpisode } from "@/lib/memory/index-episode";
import { searchMemory } from "@/lib/memory/search";
import { createCalendarEvent, createGmailDraft } from "@/lib/google/calendar-gmail";

async function mockFallback(
  userId: string,
  kind: "email" | "calendar",
  payload: Record<string, unknown>,
  reason: "not_connected" | "google_api_error" | "invalid_datetime",
  error?: unknown,
) {
  await db.insert(mockOutbox).values({
    userId,
    kind,
    payload: JSON.stringify(payload),
  });
  return {
    ok: true,
    mocked: true,
    reason,
    ...(error instanceof Error ? { detail: error.message.slice(0, 200) } : {}),
    ...payload,
  };
}

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
    const [open, passages] = await Promise.all([
      db
        .select()
        .from(promises)
        .where(
          and(eq(promises.personId, personId), eq(promises.status, "open")),
        ),
      query.trim()
        ? searchMemory({ userId: session.userId, personId, query, k: 5 })
        : Promise.resolve([]),
    ]);
    return {
      person: person?.name,
      brief: person?.relationshipBrief,
      query,
      openPromises: open.map((p) => p.text),
      passages: passages.map((p) => ({
        speaker: p.speaker,
        text: p.content,
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
      to: input.args.to ? String(input.args.to) : undefined,
      subject: String(input.args.subject ?? ""),
      body: String(input.args.body ?? ""),
    };
    try {
      const draft = await createGmailDraft({ userId: session.userId, ...payload });
      if (draft) {
        return { ok: true, mocked: false, draftId: draft.id, ...payload };
      }
      return mockFallback(session.userId, "email", payload, "not_connected");
    } catch (error) {
      console.error("Gmail draft failed, falling back to mock", error);
      return mockFallback(session.userId, "email", payload, "google_api_error", error);
    }
  }

  if (input.name === "hold_calendar") {
    const payload = {
      title: String(input.args.title ?? ""),
      startTime: input.args.startTime ? String(input.args.startTime) : undefined,
      endTime: input.args.endTime ? String(input.args.endTime) : undefined,
    };
    if (
      !payload.startTime ||
      !payload.endTime ||
      Number.isNaN(Date.parse(payload.startTime)) ||
      Number.isNaN(Date.parse(payload.endTime))
    ) {
      return mockFallback(session.userId, "calendar", payload, "invalid_datetime");
    }
    try {
      const event = await createCalendarEvent({
        userId: session.userId,
        title: payload.title,
        startTime: payload.startTime,
        endTime: payload.endTime,
      });
      if (event) {
        return { ok: true, mocked: false, eventUrl: event.url, ...payload };
      }
      return mockFallback(session.userId, "calendar", payload, "not_connected");
    } catch (error) {
      console.error("Calendar event failed, falling back to mock", error);
      return mockFallback(session.userId, "calendar", payload, "google_api_error", error);
    }
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

export async function buildKeyterms(sessionId: string, cap = 100) {
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

  return [...new Set(keyterms)].slice(0, cap);
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
When woken, be brief. Use tools for memory, promises, email, and calendar instead of inventing facts. Calendar/email tools require exact ISO 8601 start and end times — ask for a specific date and time if the person is vague.
${memory}`;
}

export async function writePostSessionBrief(
  sessionId: string,
  data: {
    transcript: string;
    utterances?: { speaker?: string; text: string; start?: number; end?: number }[];
    entities?: TranscriptEntity[];
    sentimentResults?: TranscriptSentiment[];
  },
) {
  const { transcript, utterances, entities, sentimentResults } = data;
  const [session] = await db
    .select()
    .from(callSessions)
    .where(eq(callSessions.id, sessionId));
  if (!session?.personId) {
    return;
  }
  const personId = session.personId;

  const [person] = await db.select().from(people).where(eq(people.id, personId));

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
    // No structured-output mode on this account's Gateway model — strip a
    // ```json fence if the model added one despite being asked not to.
    const stripped = raw.trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
    parsed = JSON.parse(stripped) as typeof parsed;
  } catch {
    parsed = { brief: raw.slice(0, 1200), promises: [], topics: "" };
  }

  const brief = parsed.brief?.trim() || person?.relationshipBrief || raw.slice(0, 800);

  const [episode] = await db
    .insert(episodes)
    .values({
      userId: session.userId,
      personId,
      sessionId: session.id,
      title: `Google Meet with ${person?.name ?? "them"}`,
      brief,
      transcript,
      transcriptJson: utterances ? JSON.stringify(utterances) : null,
      topics: parsed.topics,
      entitiesJson: entities?.length ? JSON.stringify(dedupeEntities(entities)) : null,
      sentimentJson: sentimentResults?.length
        ? JSON.stringify(sentimentResults)
        : null,
      occurredAt: session.startedAt ?? new Date(),
    })
    .returning();

  await db
    .update(people)
    .set({
      relationshipBrief: brief,
      lastSpokeAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(people.id, personId));

  const promiseTexts = (parsed.promises ?? [])
    .map((text) => text.trim())
    .filter(Boolean);
  if (promiseTexts.length > 0) {
    await db.insert(promises).values(
      promiseTexts.map((text) => ({
        userId: session.userId,
        personId,
        text,
        sourceSessionId: session.id,
      })),
    );
  }

  await indexEpisode(episode.id);
}

function dedupeEntities(entities: TranscriptEntity[]) {
  const seen = new Set<string>();
  const deduped: TranscriptEntity[] = [];
  for (const entity of entities) {
    const key = `${entity.entity_type}:${entity.text.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(entity);
  }
  return deduped;
}
