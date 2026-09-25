import { attachDatabasePool } from "@vercel/functions";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://user:pass@127.0.0.1:5432/pocketless";

const pool = new Pool({ connectionString: databaseUrl });
attachDatabasePool(pool);

export const db = drizzle(pool);
