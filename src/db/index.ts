import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://user:pass@127.0.0.1:5432/pocketless";

export const db = drizzle(new Pool({ connectionString: databaseUrl }));
