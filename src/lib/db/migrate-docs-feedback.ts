import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:linkedgrow.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
  console.log("Creating docs_feedback table...");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS docs_feedback (
      id TEXT PRIMARY KEY NOT NULL,
      article_slug TEXT NOT NULL,
      category_slug TEXT NOT NULL,
      helpful INTEGER NOT NULL,
      reason TEXT,
      created_at INTEGER
    )
  `);
  console.log("Created docs_feedback table");

  console.log("Migration complete!");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
