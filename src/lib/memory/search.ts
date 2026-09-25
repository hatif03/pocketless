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

  // ponytail: to_tsvector computed at query time, no stored column or GIN
  // index — fine at hackathon-demo data volume, add an index if a person's
  // transcript corpus grows large enough for this to show up as a slow query.
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
      AND to_tsvector('english', content) @@ plainto_tsquery('english', ${input.query})
    ORDER BY ts_rank(to_tsvector('english', content), plainto_tsquery('english', ${input.query})) DESC
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
