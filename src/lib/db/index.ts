import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

// Turso/LibSQL client configuration
// Uses Turso in production, local SQLite file in development
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:linkedgrow.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });

export * from "./schema";
