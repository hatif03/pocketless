import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { episodes, memoryChunks } from "@/db/schema";
import { chunkUtterances, type Utterance } from "@/lib/memory/chunk-utterances";

export async function indexEpisode(episodeId: string) {
  const [episode] = await db
    .select()
    .from(episodes)
    .where(eq(episodes.id, episodeId));
  if (!episode) return;

  await db.delete(memoryChunks).where(eq(memoryChunks.episodeId, episodeId));

  const chunks: {
    kind: "brief" | "transcript_chunk";
    content: string;
    speaker: string | null;
    startMs: number | null;
    endMs: number | null;
  }[] = [];

  if (episode.brief?.trim()) {
    chunks.push({
      kind: "brief",
      content: episode.brief.trim(),
      speaker: null,
      startMs: null,
      endMs: null,
    });
  }

  if (episode.transcriptJson) {
    try {
      const utterances = JSON.parse(episode.transcriptJson) as Utterance[];
      for (const chunk of chunkUtterances(utterances)) {
        chunks.push({ kind: "transcript_chunk", ...chunk });
      }
    } catch {
      // malformed transcriptJson — skip transcript chunking, brief chunk still indexed
    }
  }

  if (chunks.length === 0) return;

  await db.insert(memoryChunks).values(
    chunks.map((chunk, index) => ({
      userId: episode.userId,
      personId: episode.personId,
      episodeId: episode.id,
      kind: chunk.kind,
      content: chunk.content,
      speaker: chunk.speaker,
      startMs: chunk.startMs,
      endMs: chunk.endMs,
      chunkIndex: index,
    })),
  );
}
