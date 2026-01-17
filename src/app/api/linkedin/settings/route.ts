import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: {
        linkedinAccessToken: true,
        linkedinProfileId: true,
        linkedinProfileName: true,
        linkedinPostingTarget: true,
        linkedinSelectedOrgId: true,
        linkedinSelectedOrgName: true,
        linkedinOrganizations: true,
        image: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isConnected = !!user.linkedinAccessToken && !!user.linkedinProfileId;

    // Parse organizations
    let organizations = [];
    if (user.linkedinOrganizations) {
      try {
        organizations = JSON.parse(user.linkedinOrganizations);
      } catch {
        organizations = [];
      }
    }

    return NextResponse.json({
      connected: isConnected,
      profileId: user.linkedinProfileId,
      profileName: user.linkedinProfileName,
      profileImage: user.image,
      postingTarget: user.linkedinPostingTarget || 'profile',
      selectedOrgId: user.linkedinSelectedOrgId,
      selectedOrgName: user.linkedinSelectedOrgName,
      organizations,
      hasOrganizations: organizations.length > 0,
    });
  } catch (error) {
    console.error('Failed to get LinkedIn settings:', error);
    return NextResponse.json(
      { error: 'Failed to load LinkedIn settings' },
      { status: 500 }
    );
  }
}
