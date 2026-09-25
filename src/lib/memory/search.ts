import "server-only";

import { sql } from "drizzle-orm";

import { db } from "@/db";

export type MemoryPassage = {
  episodeId: string;
  kind: "brief" | "transcript_chunk";
  content: string;
  speaker: string | null;
  startMs: number | null;
  endMs: number | null;
};

export async function searchMemory(input: {
  userId: string;
  personId?: string;
  query: string;
  k?: number;
}): Promise<MemoryPassage[]> {
  const k = input.k ?? 5;
  if (!input.query.trim()) return [];

  // Full-text search runs inside the live voice-agent tool-call path, so it's
  // backed by a stored, generated tsvector column + GIN index (see
  // scripts/add-memory-search-index.ts) rather than computed per-query.
  const result = await db.execute<{
    episode_id: string;
    kind: "brief" | "transcript_chunk";
    content: string;
    speaker: string | null;
    start_ms: number | null;
    end_ms: number | null;
  }>(sql`
    SELECT episode_id, kind, content, speaker, start_ms, end_ms
    FROM memory_chunks
    WHERE user_id = ${input.userId}
      ${input.personId ? sql`AND person_id = ${input.personId}` : sql``}
      AND content_tsv @@ plainto_tsquery('english', ${input.query})
    ORDER BY ts_rank(content_tsv, plainto_tsquery('english', ${input.query})) DESC
    LIMIT ${k}
  `);

  return result.rows.map((row) => ({
    episodeId: row.episode_id,
    kind: row.kind,
    content: row.content,
    speaker: row.speaker,
    startMs: row.start_ms,
    endMs: row.end_ms,
  }));
}
