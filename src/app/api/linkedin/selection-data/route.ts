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

    // Fetch user data including LinkedIn info and organizations
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.linkedinAccessToken) {
      return NextResponse.json({ error: 'LinkedIn not connected' }, { status: 400 });
    }

    // Parse stored organizations
    let organizations = [];
    if (user.linkedinOrganizations) {
      try {
        organizations = JSON.parse(user.linkedinOrganizations);
      } catch {
        organizations = [];
      }
    }

    return NextResponse.json({
      profileId: user.linkedinProfileId,
      profileName: user.linkedinProfileName,
      profileImage: user.image,
      organizations,
    });
  } catch (error) {
    console.error('Failed to get selection data:', error);
    return NextResponse.json(
      { error: 'Failed to load selection data' },
      { status: 500 }
    );
  }
}
