import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { teamInvites, teams, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/team/invite/validate?token=xxx - Validate an invite token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Find the invite
    const invite = await db.query.teamInvites.findFirst({
      where: eq(teamInvites.token, token),
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invite not found or has been cancelled" },
        { status: 404 }
      );
    }

    // Check if expired
    if (invite.expiresAt && new Date() > invite.expiresAt) {
      return NextResponse.json(
        { error: "This invitation has expired" },
        { status: 410 }
      );
    }

    // Get team details
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, invite.teamId),
    });

    if (!team) {
      return NextResponse.json(
        { error: "Team no longer exists" },
        { status: 404 }
      );
    }

    // Return minimal info needed for invite page UI
    // Don't expose owner details or full email to prevent information harvesting
    // Mask email: co*****@di****.me
    const maskEmail = (email: string) => {
      const [local, domain] = email.split('@');
      const [domainName, ...tld] = domain.split('.');
      const tldPart = tld.join('.');

      const maskedLocal = local.length <= 2
        ? local + '*****'
        : local.slice(0, 2) + '*'.repeat(Math.min(local.length - 2, 5));

      const maskedDomain = domainName.length <= 2
        ? domainName + '****'
        : domainName.slice(0, 2) + '*'.repeat(Math.min(domainName.length - 2, 4));

      return `${maskedLocal}@${maskedDomain}.${tldPart}`;
    };

    return NextResponse.json({
      invite: {
        teamName: team.name,
        role: invite.role,
        emailHint: maskEmail(invite.email),
      },
    });
  } catch (error) {
return NextResponse.json(
      { error: "Failed to validate invite" },
      { status: 500 }
    );
  }
}
