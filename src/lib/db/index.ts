import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";

// Create SQLite database (will be replaced with D1 in production)
const sqlite = new Database("linkedgrow.db");
export const db = drizzle(sqlite, { schema });

export * from "./schema";
