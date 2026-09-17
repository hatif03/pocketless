import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://user:pass@127.0.0.1:5432/pocketless";

export const db = drizzle(neon(databaseUrl));
