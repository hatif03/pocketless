// One-off: applies the index() definitions from src/db/schema.ts directly.
// Needed because this database also has the raw-SQL content_tsv column
// (scripts/add-memory-search-index.ts) that isn't declared in schema.ts —
// `drizzle-kit push` sees it as an unrecognized column and offers to drop it
// on every push, so index rollout here goes through raw SQL instead of push.
//
// Usage: npx tsx scripts/add-schema-indexes.ts
import "dotenv/config";
import { sql } from "drizzle-orm";

import { db } from "../src/db";

const STATEMENTS = [
  `CREATE INDEX IF NOT EXISTS people_user_idx ON people USING btree (user_id)`,
  `CREATE INDEX IF NOT EXISTS promises_user_status_idx ON promises USING btree (user_id, status)`,
  `CREATE INDEX IF NOT EXISTS promises_person_idx ON promises USING btree (person_id)`,
  `CREATE INDEX IF NOT EXISTS call_sessions_user_idx ON call_sessions USING btree (user_id)`,
  `CREATE INDEX IF NOT EXISTS episodes_user_person_idx ON episodes USING btree (user_id, person_id)`,
  `CREATE INDEX IF NOT EXISTS memory_chunks_user_person_idx ON memory_chunks USING btree (user_id, person_id)`,
  `CREATE INDEX IF NOT EXISTS memory_chunks_episode_idx ON memory_chunks USING btree (episode_id)`,
  `CREATE INDEX IF NOT EXISTS talk_messages_user_person_idx ON talk_messages USING btree (user_id, person_id)`,
];

async function main() {
  for (const statement of STATEMENTS) {
    await db.execute(sql.raw(statement));
  }
  console.log(`applied ${STATEMENTS.length} index statements`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
