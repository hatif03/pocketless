export type Utterance = { speaker?: string; text: string; start?: number; end?: number };

const TARGET_WORDS = 200;

export function chunkUtterances(utterances: Utterance[]) {
  const chunks: {
    content: string;
    speaker: string | null;
    startMs: number | null;
    endMs: number | null;
  }[] = [];

  let buffer: Utterance[] = [];
  let wordCount = 0;

  const flush = () => {
    if (buffer.length === 0) return;
    chunks.push({
      content: buffer.map((u) => `${u.speaker ?? "?"}: ${u.text}`).join("\n"),
      speaker: buffer.length === 1 ? buffer[0].speaker ?? null : null,
      startMs: buffer[0].start ?? null,
      endMs: buffer[buffer.length - 1].end ?? null,
    });
    buffer = [];
    wordCount = 0;
  };

  for (const utterance of utterances) {
    buffer.push(utterance);
    wordCount += utterance.text.split(/\s+/).filter(Boolean).length;
    if (wordCount >= TARGET_WORDS) flush();
  }
  flush();

  return chunks;
}
