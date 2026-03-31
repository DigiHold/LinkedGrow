import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, users, engagementActions, engagementObjectives } from '@/lib/db';
import { eq, and, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { canAccessFeature, type PlanId } from '@/lib/plans';

// GET /api/linkedin/engagement - Get today's engagement stats and objectives
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check plan access - engagement requires Pro+
    const [planCheck] = await db.select({ plan: users.plan }).from(users).where(eq(users.id, session.user.id));
    const userPlan = (planCheck?.plan || 'free') as PlanId;
    if (!canAccessFeature(userPlan, 'engagement')) {
      return NextResponse.json(
        { error: 'Engagement tools require a Pro plan or higher. Please upgrade to access this feature.' },
        { status: 403 }
      );
    }

    const userId = session.user.id;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Get user's objectives (or use defaults)
    const objectives = await db.query.engagementObjectives.findFirst({
      where: eq(engagementObjectives.userId, userId),
    });

    const dailyLikes = objectives?.dailyLikes ?? 10;
    const dailyComments = objectives?.dailyComments ?? 5;
    const postsPerProfile = objectives?.postsPerProfile ?? 2;

    // Count today's likes
    const likesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(engagementActions)
      .where(
        and(
          eq(engagementActions.userId, userId),
          eq(engagementActions.type, 'like'),
          eq(engagementActions.date, today)
        )
      );

    // Count today's comments
    const commentsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(engagementActions)
      .where(
        and(
          eq(engagementActions.userId, userId),
          eq(engagementActions.type, 'comment'),
          eq(engagementActions.date, today)
        )
      );

    const todayLikes = likesResult[0]?.count ?? 0;
    const todayComments = commentsResult[0]?.count ?? 0;

    // Get user's LinkedIn profile info
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        linkedinProfileName: true,
        linkedinAccessToken: true,
        image: true,
      },
    });

    return NextResponse.json({
      objectives: {
        dailyLikes,
        dailyComments,
        postsPerProfile,
      },
      today: {
        likes: todayLikes,
        comments: todayComments,
      },
      linkedInConnected: !!user?.linkedinAccessToken,
      profileName: user?.linkedinProfileName,
      profileImage: user?.image,
    });
  } catch (error) {
return NextResponse.json(
      { error: 'Failed to load engagement stats' },
      { status: 500 }
    );
  }
}

// POST /api/linkedin/engagement - Track a new engagement action
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check plan access - engagement requires Pro+
    const [postUser] = await db.select({ plan: users.plan }).from(users).where(eq(users.id, session.user.id));
    const postUserPlan = (postUser?.plan || 'free') as PlanId;
    if (!canAccessFeature(postUserPlan, 'engagement')) {
      return NextResponse.json(
        { error: 'Engagement tools require a Pro plan or higher. Please upgrade to access this feature.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type, linkedinPostId, commentContent } = body;

    if (!type || !['like', 'comment'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid action type. Must be "like" or "comment"' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Insert the engagement action
    await db.insert(engagementActions).values({
      id: nanoid(),
      userId,
      type,
      linkedinPostId: linkedinPostId || null,
      commentContent: type === 'comment' ? commentContent : null,
      date: today,
      createdAt: new Date(),
    });

    // Return updated counts
    const likesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(engagementActions)
      .where(
        and(
          eq(engagementActions.userId, userId),
          eq(engagementActions.type, 'like'),
          eq(engagementActions.date, today)
        )
      );

    const commentsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(engagementActions)
      .where(
        and(
          eq(engagementActions.userId, userId),
          eq(engagementActions.type, 'comment'),
          eq(engagementActions.date, today)
        )
      );

    return NextResponse.json({
      success: true,
      today: {
        likes: likesResult[0]?.count ?? 0,
        comments: commentsResult[0]?.count ?? 0,
      },
    });
  } catch (error) {
return NextResponse.json(
      { error: 'Failed to track engagement action' },
      { status: 500 }
    );
  }
}

// PUT /api/linkedin/engagement - Update engagement objectives
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check plan access - engagement requires Pro+
    const [putUser] = await db.select({ plan: users.plan }).from(users).where(eq(users.id, session.user.id));
    const putUserPlan = (putUser?.plan || 'free') as PlanId;
    if (!canAccessFeature(putUserPlan, 'engagement')) {
      return NextResponse.json(
        { error: 'Engagement tools require a Pro plan or higher. Please upgrade to access this feature.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { dailyLikes, dailyComments, postsPerProfile } = body;

    // Validate inputs
    if (
      (dailyLikes !== undefined && (typeof dailyLikes !== 'number' || dailyLikes < 1 || dailyLikes > 100)) ||
      (dailyComments !== undefined && (typeof dailyComments !== 'number' || dailyComments < 1 || dailyComments > 50)) ||
      (postsPerProfile !== undefined && (typeof postsPerProfile !== 'number' || postsPerProfile < 1 || postsPerProfile > 10))
    ) {
      return NextResponse.json(
        { error: 'Invalid settings. Likes 1-100, comments 1-50, posts per profile 1-10.' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Check if objectives exist
    const existing = await db.query.engagementObjectives.findFirst({
      where: eq(engagementObjectives.userId, userId),
    });

    if (existing) {
      await db
        .update(engagementObjectives)
        .set({
          dailyLikes: dailyLikes ?? existing.dailyLikes,
          dailyComments: dailyComments ?? existing.dailyComments,
          postsPerProfile: postsPerProfile ?? existing.postsPerProfile,
          updatedAt: new Date(),
        })
        .where(eq(engagementObjectives.userId, userId));
    } else {
      await db.insert(engagementObjectives).values({
        id: nanoid(),
        userId,
        dailyLikes: dailyLikes ?? 10,
        dailyComments: dailyComments ?? 5,
        postsPerProfile: postsPerProfile ?? 2,
        updatedAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      objectives: {
        dailyLikes: dailyLikes ?? existing?.dailyLikes ?? 10,
        dailyComments: dailyComments ?? existing?.dailyComments ?? 5,
        postsPerProfile: postsPerProfile ?? existing?.postsPerProfile ?? 2,
      },
    });
  } catch (error) {
return NextResponse.json(
      { error: 'Failed to update objectives' },
      { status: 500 }
    );
  }
}
