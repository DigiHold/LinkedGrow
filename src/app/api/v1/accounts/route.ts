import { NextRequest } from "next/server";
import { db, linkedinAccounts } from "@/lib/db";
import { eq, asc } from "drizzle-orm";
import {
  authenticateApiRequest,
  hasScope,
  apiErrorResponse,
  apiSuccessResponse,
} from "@/lib/api-auth";
import { loadSessionUser } from "@/lib/auth-user";

// GET /api/v1/accounts - The workspace's connected LinkedIn accounts.
//
// This exists so an API consumer can pick which account a post publishes
// from: pass one of these ids as linkedinAccountId when creating or updating
// a post. Only accounts with status "active" are accepted there; the others
// are listed anyway so a disconnected account explains itself. Nothing
// sensitive leaves this route: no email, no credentials, no session state.
export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest(request);
  if (!auth.success) {
    return apiErrorResponse(auth.error!, auth.statusCode!);
  }

  if (!hasScope(auth.scopes!, "posts:read")) {
    return apiErrorResponse("Missing required scope: posts:read", 403);
  }

  try {
    const sessionData = await loadSessionUser(auth.userId!);
    const workspaceId = sessionData?.teamOwnerId ?? auth.userId!;

    const rows = await db
      .select({
        id: linkedinAccounts.id,
        fullName: linkedinAccounts.fullName,
        headline: linkedinAccounts.headline,
        profileUrl: linkedinAccounts.profileUrl,
        avatarUrl: linkedinAccounts.avatarUrl,
        status: linkedinAccounts.status,
        createdAt: linkedinAccounts.createdAt,
      })
      .from(linkedinAccounts)
      .where(eq(linkedinAccounts.workspaceId, workspaceId))
      .orderBy(asc(linkedinAccounts.createdAt));

    return apiSuccessResponse(
      rows.map((a) => ({
        id: a.id,
        fullName: a.fullName || null,
        headline: a.headline || null,
        profileUrl: a.profileUrl || null,
        avatarUrl: a.avatarUrl || null,
        status: a.status,
        createdAt: a.createdAt?.toISOString() || null,
      }))
    );
  } catch (error) {
return apiErrorResponse("Failed to list LinkedIn accounts", 500);
  }
}
