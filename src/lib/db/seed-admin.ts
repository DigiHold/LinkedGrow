import { db, users } from "./index";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

async function seedAdmin() {
  const adminEmail = "nicolas@linkedgrow.ai";
  const adminPassword = "at3xJJnK@uuR-o8";
  const adminName = "Nicolas";

  // Hash the password
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  // Create admin user
  const adminUser = {
    id: uuidv4(),
    name: adminName,
    email: adminEmail,
    password: hashedPassword,
    isAdmin: true,
    plan: "business" as const,
    twoFactorEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    await db.insert(users).values(adminUser).onConflictDoUpdate({
      target: users.email,
      set: {
        password: hashedPassword,
        isAdmin: true,
        plan: "business",
        updatedAt: new Date(),
      },
    });
    console.log("Admin user created/updated successfully!");
    console.log(`Email: ${adminEmail}`);
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
}

seedAdmin();
