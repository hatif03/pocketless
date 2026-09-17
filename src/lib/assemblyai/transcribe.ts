import "server-only";

import { AssemblyAI } from "assemblyai";

export async function transcribeRecording(audioUrl: string, keyterms: string[]) {
  const key = process.env.ASSEMBLYAI_API_KEY;
  if (!key) {
    throw new Error("ASSEMBLYAI_API_KEY is not set");
  }

  const client = new AssemblyAI({ apiKey: key });
  const body = await client.transcripts.transcribe({
    audio: audioUrl,
    speaker_labels: true,
    speech_models: ["universal-3-5-pro", "universal-2"],
    keyterms_prompt: keyterms.slice(0, 100),
  });

  if (body.status === "error") {
    throw new Error(body.error || "Transcription failed");
  }

  const utterances = body.utterances ?? [];
  const transcript =
    utterances.map((u) => `${u.speaker}: ${u.text}`).join("\n") ||
    body.text ||
    "";

  return {
    transcript,
    utterances,
  };
}
