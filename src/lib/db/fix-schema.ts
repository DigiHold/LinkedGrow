import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:linkedgrow.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function fixSchema() {
  console.log("Checking and fixing schema...\n");

  // Get current columns in users table
  const columns = await client.execute("PRAGMA table_info(users)");
  const existingColumns = columns.rows.map(r => r.name as string);
  console.log("Existing columns:", existingColumns.join(", "));

  // Columns that should exist
  const requiredColumns = [
    { name: "coupon_code", sql: "ALTER TABLE users ADD COLUMN coupon_code TEXT" },
    { name: "linkedin_posting_target", sql: "ALTER TABLE users ADD COLUMN linkedin_posting_target TEXT DEFAULT 'profile'" },
    { name: "linkedin_selected_org_id", sql: "ALTER TABLE users ADD COLUMN linkedin_selected_org_id TEXT" },
    { name: "linkedin_selected_org_name", sql: "ALTER TABLE users ADD COLUMN linkedin_selected_org_name TEXT" },
    { name: "linkedin_organizations", sql: "ALTER TABLE users ADD COLUMN linkedin_organizations TEXT" },
    { name: "linkedin_community_access_token", sql: "ALTER TABLE users ADD COLUMN linkedin_community_access_token TEXT" },
    { name: "linkedin_community_refresh_token", sql: "ALTER TABLE users ADD COLUMN linkedin_community_refresh_token TEXT" },
    { name: "linkedin_community_token_expiry", sql: "ALTER TABLE users ADD COLUMN linkedin_community_token_expiry INTEGER" },
    { name: "ai_model", sql: "ALTER TABLE users ADD COLUMN ai_model TEXT" },
    { name: "sample_posts", sql: "ALTER TABLE users ADD COLUMN sample_posts TEXT" },
    { name: "never_mention", sql: "ALTER TABLE users ADD COLUMN never_mention TEXT" },
    { name: "business_description", sql: "ALTER TABLE users ADD COLUMN business_description TEXT" },
    { name: "target_audience", sql: "ALTER TABLE users ADD COLUMN target_audience TEXT" },
    { name: "writing_tone", sql: "ALTER TABLE users ADD COLUMN writing_tone TEXT" },
    { name: "brand_logo_url", sql: "ALTER TABLE users ADD COLUMN brand_logo_url TEXT" },
    { name: "brand_primary_color", sql: "ALTER TABLE users ADD COLUMN brand_primary_color TEXT" },
    { name: "brand_secondary_color", sql: "ALTER TABLE users ADD COLUMN brand_secondary_color TEXT" },
    { name: "brand_font_family", sql: "ALTER TABLE users ADD COLUMN brand_font_family TEXT" },
  ];

  for (const col of requiredColumns) {
    if (!existingColumns.includes(col.name)) {
      console.log(`Adding missing column: ${col.name}`);
      await client.execute(col.sql);
    }
  }

  // Now check/update the admin user
  console.log("\nChecking users...");
  const users = await client.execute("SELECT id, email, is_admin, plan FROM users");
  console.log("\nAll users:");
  for (const row of users.rows) {
    console.log(`- ${row.email} (admin: ${row.is_admin}, plan: ${row.plan})`);
  }

  // Set admin for contact@linkedgrow.ai
  console.log("\nSetting admin for contact@linkedgrow.ai...");
  await client.execute({
    sql: "UPDATE users SET is_admin = 1, plan = 'business' WHERE email = ?",
    args: ["contact@linkedgrow.ai"]
  });

  // Verify
  const updated = await client.execute({
    sql: "SELECT id, email, is_admin, plan FROM users WHERE email = ?",
    args: ["contact@linkedgrow.ai"]
  });

  if (updated.rows.length > 0) {
    const user = updated.rows[0];
    console.log(`\nUpdated: ${user.email} -> admin: ${user.is_admin}, plan: ${user.plan}`);
  } else {
    console.log("\nUser contact@linkedgrow.ai not found!");
  }

  console.log("\nDone!");
  process.exit(0);
}

fixSchema().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
