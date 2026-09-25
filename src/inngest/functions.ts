import { eq } from "drizzle-orm";

import { db } from "@/db";
import { callSessions } from "@/db/schema";
import { writePostSessionBrief } from "@/lib/agent-tools";
import { transcribeRecording } from "@/lib/assemblyai/transcribe";
import { inngest } from "@/inngest/client";

export const sessionProcessing = inngest.createFunction(
  { id: "sessions/processing" },
  { event: "sessions/processing" },
  async ({ event, step }) => {
    const sessionId = event.data.sessionId as string;
    const recordingUrl = event.data.recordingUrl as string | undefined;

    const session = await step.run("load-session", async () => {
      const rows = await db
        .select()
        .from(callSessions)
        .where(eq(callSessions.id, sessionId));
      return rows[0] ?? null;
    });

    if (!session) {
      return { skipped: true };
    }

    let transcription: Awaited<ReturnType<typeof transcribeRecording>> | null =
      null;
    if (recordingUrl) {
      transcription = await step.run("transcribe", async () => {
        const names = ["Pocketless"];
        return transcribeRecording(recordingUrl, names);
      });
    }

    if (transcription?.transcript) {
      await step.run("brief", async () => {
        await writePostSessionBrief(sessionId, transcription!);
      });
    }

    await step.run("complete", async () => {
      await db
        .update(callSessions)
        .set({
          status: "completed",
          recordingUrl: recordingUrl ?? session.recordingUrl,
          endedAt: session.endedAt ? new Date(session.endedAt) : new Date(),
          updatedAt: new Date(),
        })
        .where(eq(callSessions.id, sessionId));
    });

    return { ok: true };
  },
);
