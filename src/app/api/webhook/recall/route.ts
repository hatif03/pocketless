import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { callSessions } from "@/db/schema";
import { inngest } from "@/inngest/client";

type RecallPayload = {
  event?: string;
  bot_id?: string;
  data?: {
    bot?: {
      id?: string;
      status?: { code?: string };
    };
    data?: {
      code?: string;
    };
    status?: { code?: string };
    recording?: {
      media_shortcuts?: {
        video_mixed?: { data?: { download_url?: string } };
        audio_mixed?: { data?: { download_url?: string } };
      };
    };
    bot_id?: string;
  };
};

function statusFromRecall(
  code?: string,
): "queued" | "in_call" | "processing" | "failed" | null {
  if (!code) return null;
  if (
    code === "joining_call" ||
    code === "in_waiting_room" ||
    code === "in_call_not_recording"
  ) {
    return "queued";
  }
  if (code === "in_call_recording" || code === "in_call") {
    return "in_call";
  }
  if (
    code === "call_ended" ||
    code === "done" ||
    code === "analysis_done" ||
    code === "recording.done" ||
    code === "bot.done"
  ) {
    return "processing";
  }
  if (code === "fatal" || code === "recording_permission_denied") {
    return "failed";
  }
  return null;
}

export async function POST(req: NextRequest) {
  const payload = (await req.json()) as RecallPayload;
  const botId =
    payload.data?.bot?.id ||
    payload.data?.bot_id ||
    payload.bot_id ||
    (payload as { bot?: { id?: string } }).bot?.id;

  if (!botId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const [session] = await db
    .select()
    .from(callSessions)
    .where(eq(callSessions.recallBotId, botId));

  if (!session) {
    return NextResponse.json({ ok: true, unknownBot: true });
  }

  const code =
    payload.data?.bot?.status?.code ||
    payload.data?.status?.code ||
    payload.data?.data?.code ||
    payload.event;

  const nextStatus = statusFromRecall(code);
  const recordingUrl =
    payload.data?.recording?.media_shortcuts?.audio_mixed?.data?.download_url ||
    payload.data?.recording?.media_shortcuts?.video_mixed?.data?.download_url;

  if (nextStatus || recordingUrl) {
    await db
      .update(callSessions)
      .set({
        status: nextStatus ?? session.status,
        startedAt:
          nextStatus === "in_call"
            ? (session.startedAt ?? new Date())
            : session.startedAt,
        endedAt:
          nextStatus === "processing" || nextStatus === "failed"
            ? new Date()
            : session.endedAt,
        recordingUrl: recordingUrl ?? session.recordingUrl,
        updatedAt: new Date(),
      })
      .where(eq(callSessions.id, session.id));
  }

  const shouldProcess =
    nextStatus === "processing" ||
    payload.event === "recording.done" ||
    Boolean(recordingUrl && session.status !== "completed");

  if (shouldProcess) {
    await inngest.send({
      name: "sessions/processing",
      data: {
        sessionId: session.id,
        recordingUrl: recordingUrl ?? session.recordingUrl,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
