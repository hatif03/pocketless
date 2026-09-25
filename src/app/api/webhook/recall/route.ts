import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { callSessions } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { verifySvixWebhook } from "@/lib/webhook-signature";

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
  const secret = process.env.RECALL_WEBHOOK_SECRET;
  const rawBody = await req.text();

  if (secret) {
    const valid = verifySvixWebhook({
      id: req.headers.get("svix-id") ?? req.headers.get("webhook-id"),
      timestamp:
        req.headers.get("svix-timestamp") ?? req.headers.get("webhook-timestamp"),
      signature:
        req.headers.get("svix-signature") ?? req.headers.get("webhook-signature"),
      body: rawBody,
      secret,
    });
    if (!valid) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  } else {
    console.warn(
      "RECALL_WEBHOOK_SECRET is not set — accepting this webhook unverified. " +
        "Set it from the Recall dashboard's webhook signing secret to close this gap.",
    );
  }

  const payload = JSON.parse(rawBody) as RecallPayload;
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
    session.status !== "completed" &&
    (nextStatus === "processing" ||
      payload.event === "recording.done" ||
      Boolean(recordingUrl));

  if (shouldProcess) {
    await inngest.send({
      // Stable per session+status so Recall's webhook retries (and duplicate
      // event types carrying the same transition) dedupe instead of
      // re-processing and creating duplicate episodes/promises.
      id: `recall-${session.id}-${nextStatus ?? "recording"}`,
      name: "sessions/processing",
      data: {
        sessionId: session.id,
        recordingUrl: recordingUrl ?? session.recordingUrl,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
