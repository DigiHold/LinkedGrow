import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';

interface SelectTargetRequest {
  postingTarget: 'profile' | 'organization';
  organizationId?: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: SelectTargetRequest = await request.json();
    const { postingTarget, organizationId } = body;

    if (!postingTarget || !['profile', 'organization'].includes(postingTarget)) {
      return NextResponse.json({ error: 'Invalid posting target' }, { status: 400 });
    }

    // Fetch user to get current data
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.linkedinAccessToken) {
      return NextResponse.json({ error: 'LinkedIn not connected' }, { status: 400 });
    }

    // If selecting organization, validate the organization ID exists
    let organizationName: string | null = null;
    if (postingTarget === 'organization') {
      if (!organizationId) {
        return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
      }

      // Parse stored organizations and find the selected one
      let organizations = [];
      if (user.linkedinOrganizations) {
        try {
          organizations = JSON.parse(user.linkedinOrganizations);
        } catch {
          organizations = [];
        }
      }

      const selectedOrg = organizations.find((org: { id: string; name: string }) => org.id === organizationId);
      if (!selectedOrg) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 400 });
      }
      organizationName = selectedOrg.name;
    }

    // Update user with selection
    await db
      .update(users)
      .set({
        linkedinPostingTarget: postingTarget,
        linkedinSelectedOrgId: postingTarget === 'organization' ? organizationId : null,
        linkedinSelectedOrgName: organizationName,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({
      success: true,
      postingTarget,
      profileName: user.linkedinProfileName,
      organizationName,
    });
  } catch (error) {
    console.error('Failed to save selection:', error);
    return NextResponse.json(
      { error: 'Failed to save selection' },
      { status: 500 }
    );
  }
}
