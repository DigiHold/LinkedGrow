import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { teamMembers, teamEngagementJobs, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

// GET - Get engagement log for team owner/admin
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user's team membership
    const membership = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.userId, session.user.id),
    });

    if (!membership || membership.role === "member") {
      return NextResponse.json(
        { error: "Only team owners and admins can view engagement logs" },
        { status: 403 }
      );
    }

    // Get all team members for this team
    const teamMembersList = await db.query.teamMembers.findMany({
      where: eq(teamMembers.teamId, membership.teamId),
    });

    const memberIds = teamMembersList.map((m) => m.id);

    // Fetch jobs for all team members, ordered by most recent
    const allJobs: {
      id: string;
      postId: string;
      userId: string;
      actionType: string;
      status: string | null;
      commentText: string | null;
      errorMessage: string | null;
      delaySeconds: number | null;
      createdAt: Date | null;
      completedAt: Date | null;
    }[] = [];

    for (const memberId of memberIds) {
      const jobs = await db
        .select({
          id: teamEngagementJobs.id,
          postId: teamEngagementJobs.postId,
          userId: teamEngagementJobs.userId,
          actionType: teamEngagementJobs.actionType,
          status: teamEngagementJobs.status,
          commentText: teamEngagementJobs.commentText,
          errorMessage: teamEngagementJobs.errorMessage,
          delaySeconds: teamEngagementJobs.delaySeconds,
          createdAt: teamEngagementJobs.createdAt,
          completedAt: teamEngagementJobs.completedAt,
        })
        .from(teamEngagementJobs)
        .where(eq(teamEngagementJobs.teamMemberId, memberId))
        .orderBy(desc(teamEngagementJobs.createdAt))
        .limit(50);

      allJobs.push(...jobs);
    }

    // Sort all jobs by creation date (newest first)
    allJobs.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    // Enrich with user names (limit to 100 most recent)
    const enrichedJobs = [];
    for (const job of allJobs.slice(0, 100)) {
      const [user] = await db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, job.userId))
        .limit(1);

      enrichedJobs.push({
        ...job,
        userName: user?.name || user?.email || "Unknown",
      });
    }

    return NextResponse.json({ jobs: enrichedJobs });
  } catch (error) {
    console.error("Failed to get engagement log:", error);
    return NextResponse.json(
      { error: "Failed to get engagement log" },
      { status: 500 }
    );
  }
}
