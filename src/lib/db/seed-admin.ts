import { db, users } from "./index";
import { eq } from "drizzle-orm";

// The email of the account to promote, required:
//   npm run db:seed-admin -- you@example.com
const adminEmail = process.argv[2];

async function setAdmin() {
  if (!adminEmail) {
    console.error("Usage: npm run db:seed-admin -- you@example.com");
    process.exit(1);
  }

  try {
    // Find user by email and set as admin
    await db
      .update(users)
      .set({
        isAdmin: true,
        updatedAt: new Date(),
      })
      .where(eq(users.email, adminEmail));

    console.log(`Admin status set for: ${adminEmail}`);
    console.log("Done!");
  } catch (error) {
    console.error("Error setting admin:", error);
  }

  process.exit(0);
}

setAdmin();
