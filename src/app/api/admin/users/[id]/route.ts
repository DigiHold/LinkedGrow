import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, users, teams, apiLogs } from "@/lib/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// GET /api/admin/users/[id] - Get single user details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return user data (exclude sensitive fields)
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      plan: user.plan,
      isAdmin: user.isAdmin,
      twoFactorEnabled: user.twoFactorEnabled,
      linkedinProfileName: user.linkedinProfileName,
      stripeCustomerId: user.stripeCustomerId,
      stripeSubscriptionId: user.stripeSubscriptionId,
      createdAt: user.createdAt?.toISOString(),
      updatedAt: user.updatedAt?.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, email, plan, isAdmin, password } = body;

    // Verify user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent admin from removing their own admin status
    if (id === session.user.id && isAdmin === false) {
      return NextResponse.json(
        { error: "You cannot remove your own admin status" },
        { status: 400 }
      );
    }

    // Check if email is being changed and if it's already in use
    if (email && email !== existingUser.email) {
      const emailExists = await db.query.users.findFirst({
        where: eq(users.email, email),
      });
      if (emailExists) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (plan !== undefined) updateData.plan = plan;
    if (isAdmin !== undefined) updateData.isAdmin = isAdmin;

    // Handle password change
    if (password !== undefined && password.trim() !== "") {
      if (password.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters" },
          { status: 400 }
        );
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    // Update user
    await db.update(users).set(updateData).where(eq(users.id, id));

    // Fetch updated user
    const updatedUser = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser?.id,
        name: updatedUser?.name,
        email: updatedUser?.email,
        plan: updatedUser?.plan,
        isAdmin: updatedUser?.isAdmin,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete user and all their data
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    // Prevent admin from deleting themselves
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    // Verify user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete related data that doesn't have cascade delete
    // Most tables have onDelete: "cascade" so they'll be deleted automatically
    // But we need to handle tables that reference users indirectly

    // Delete teams owned by user (team members and invites will cascade)
    await db.delete(teams).where(eq(teams.ownerId, id));

    // Delete API logs (has set null on cascade, so clean up manually)
    await db.delete(apiLogs).where(eq(apiLogs.userId, id));

    // Delete the user (this cascades to: sessions, accounts, posts, media, ideas,
    // abTests, teamMembers, apiKeys, engagementActions, engagementObjectives,
    // passwordResetTokens, cookieConsents)
    await db.delete(users).where(eq(users.id, id));

    return NextResponse.json({
      success: true,
      message: "User and all associated data have been deleted",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
