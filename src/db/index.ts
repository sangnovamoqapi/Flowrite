import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

if (connectionString) {
  const client = postgres(connectionString, { max: 1 });
  db = drizzle(client, { schema });
}

export { db };
