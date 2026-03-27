import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getLinkedInUser } from '@/lib/team-utils';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get LinkedIn settings (uses team owner's settings if user is a team member)
    const result = await getLinkedInUser(session.user.id);

    if (!result) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { linkedInUser } = result;
    const isConnected = !!linkedInUser.linkedinAccessToken && !!linkedInUser.linkedinProfileId;

    // Parse organizations
    let organizations = [];
    if (linkedInUser.linkedinOrganizations) {
      try {
        organizations = JSON.parse(linkedInUser.linkedinOrganizations);
      } catch {
        organizations = [];
      }
    }

    const communityConnected = !!linkedInUser.linkedinCommunityAccessToken;

    return NextResponse.json({
      connected: isConnected,
      communityConnected,
      profileId: linkedInUser.linkedinProfileId,
      profileName: linkedInUser.linkedinProfileName,
      profileImage: linkedInUser.image,
      postingTarget: linkedInUser.linkedinPostingTarget || 'profile',
      selectedOrgId: linkedInUser.linkedinSelectedOrgId,
      selectedOrgName: linkedInUser.linkedinSelectedOrgName,
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
