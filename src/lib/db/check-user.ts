import { db, users } from "./index";
import { eq } from "drizzle-orm";

const email = process.argv[2] || "contact@linkedgrow.ai";

async function checkUser() {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (user) {
    console.log("User found:");
    console.log("- ID:", user.id);
    console.log("- Email:", user.email);
    console.log("- Name:", user.name);
    console.log("- isAdmin:", user.isAdmin);
    console.log("- Plan:", user.plan);
  } else {
    console.log("User not found with email:", email);

    // List all users
    const allUsers = await db.select({ email: users.email, isAdmin: users.isAdmin, plan: users.plan }).from(users);
    console.log("\nAll users in database:");
    allUsers.forEach(u => console.log(`- ${u.email} (admin: ${u.isAdmin}, plan: ${u.plan})`));
  }

  process.exit(0);
}

checkUser();
