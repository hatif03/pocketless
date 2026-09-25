// One-off DB setup: adds a stored, generated tsvector column + GIN index for
// full-text search over memory_chunks.content. Not modeled in src/db/schema.ts
// (drizzle-kit push has no reliable generated-column support and this repo
// has no migrations folder) — run this once per database instead.
//
// Usage: npx tsx scripts/add-memory-search-index.ts
import "dotenv/config";
import { sql } from "drizzle-orm";

import { db } from "../src/db";

async function main() {
  await db.execute(sql`
    ALTER TABLE memory_chunks
      ADD COLUMN IF NOT EXISTS content_tsv tsvector
      GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS memory_chunks_content_tsv_idx
      ON memory_chunks USING GIN (content_tsv);
  `);
  console.log("memory_chunks.content_tsv + GIN index ready");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
