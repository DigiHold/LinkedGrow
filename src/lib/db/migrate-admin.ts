import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:linkedgrow.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
  console.log("Creating admin tables...");

  // Create cookie_consents table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS cookie_consents (
      id TEXT PRIMARY KEY NOT NULL,
      visitor_id TEXT NOT NULL,
      user_id TEXT,
      necessary INTEGER DEFAULT 1,
      analytics INTEGER DEFAULT 0,
      marketing INTEGER DEFAULT 0,
      status TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      country TEXT,
      created_at INTEGER,
      updated_at INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  console.log("Created cookie_consents table");

  // Create data_removal_requests table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS data_removal_requests (
      id TEXT PRIMARY KEY NOT NULL,
      email TEXT NOT NULL,
      user_id TEXT,
      status TEXT DEFAULT 'pending',
      reason TEXT,
      admin_notes TEXT,
      processed_at INTEGER,
      processed_by TEXT,
      created_at INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE NO ACTION
    )
  `);
  console.log("Created data_removal_requests table");

  console.log("Migration complete!");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
