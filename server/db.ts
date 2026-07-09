import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

// Lazily created: server/index.ts loads .env/.env.local at the top of its own
// module body, which runs *after* static imports (including this one) are
// evaluated. Connecting eagerly here would read DATABASE_URL before it's set.
let dbInstance: NodePgDatabase<typeof schema> | null = null;

export function getDb() {
  if (!dbInstance) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required (see .env.local)");
    }
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    dbInstance = drizzle(pool, { schema });
  }
  return dbInstance;
}
