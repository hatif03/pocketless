import "server-only";

import { AssemblyAI } from "assemblyai";

export type TranscriptEntity = { entity_type: string; text: string };
export type TranscriptSentiment = {
  text: string;
  sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  confidence: number;
  speaker: string | null;
};

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
    sentiment_analysis: true,
    entity_detection: true,
    // Narrow, non-product-relevant redaction only — this app's value is
    // remembering who said what, so broad redaction (names/emails) is not applied.
    redact_pii: true,
    redact_pii_policies: ["credit_card_number", "us_social_security_number"],
    redact_pii_sub: "entity_name",
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
    entities: (body.entities ?? []) as TranscriptEntity[],
    sentimentResults: (body.sentiment_analysis_results ??
      []) as TranscriptSentiment[],
  };
}
