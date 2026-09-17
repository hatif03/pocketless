import "server-only";

import type { CapturePipe } from "@/lib/pipes/types";

function region() {
  return process.env.RECALL_REGION || "us-east-1";
}

function recallBase() {
  return `https://${region()}.recall.ai/api/v1`;
}

function recallHeaders() {
  const key = process.env.RECALL_API_KEY;
  if (!key) {
    throw new Error("RECALL_API_KEY is not set");
  }
  return {
    Authorization: `Token ${key}`,
    accept: "application/json",
    "content-type": "application/json",
  };
}

export async function createRecallMeetBot(input: {
  meetingUrl: string;
  outputMediaUrl: string;
  botName?: string;
}) {
  const response = await fetch(`${recallBase()}/bot/`, {
    method: "POST",
    headers: recallHeaders(),
    body: JSON.stringify({
      meeting_url: input.meetingUrl,
      bot_name: input.botName ?? "Pocketless",
      output_media: {
        camera: {
          kind: "webpage",
          config: {
            url: input.outputMediaUrl,
          },
        },
      },
      variant: {
        google_meet: "web_4_core",
      },
      recording_config: {
        include_bot_in_recording: {
          audio: true,
        },
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Recall create bot failed (${response.status}): ${detail}`);
  }

  return (await response.json()) as { id: string };
}

export async function stopRecallBot(botId: string) {
  const response = await fetch(`${recallBase()}/bot/${botId}/leave_call/`, {
    method: "POST",
    headers: recallHeaders(),
  });

  if (!response.ok && response.status !== 404) {
    const detail = await response.text();
    throw new Error(`Recall leave failed (${response.status}): ${detail}`);
  }
}

export const recallMeetPipe: CapturePipe = {
  start: async (input) => {
    const bot = await createRecallMeetBot({
      meetingUrl: input.meetingUrl,
      outputMediaUrl: input.outputMediaUrl,
    });
    return { botId: bot.id };
  },
  stop: async (botId) => {
    await stopRecallBot(botId);
  },
};
