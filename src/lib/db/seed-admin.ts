import { db, users } from "./index";
import { eq } from "drizzle-orm";

// Set admin email - can be overridden via command line argument
const adminEmail = process.argv[2] || "contact@linkedgrow.ai";

async function setAdmin() {
  try {
    // Find user by email and set as admin
    const result = await db
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
