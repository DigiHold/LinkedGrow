import { qstash } from "./qstash";
import { db } from "./db";
import { blogPosts } from "./db/schema";
import { eq } from "drizzle-orm";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://linkedgrow.ai";

// Publishing days: Monday (1) and Friday (5) at 7:00 AM Los Angeles time
const PUBLISH_DAYS = [1, 5]; // JS getDay(): 0=Sun, 1=Mon, 5=Fri
const PUBLISH_HOUR = 7;
const PUBLISH_TIMEZONE = "America/Los_Angeles";

/**
 * Convert a specific LA local time to a UTC Date object.
 * Handles DST transitions correctly.
 */
function getUtcDateForLATime(
  year: number,
  month: number, // 0-indexed
  day: number,
  hour: number,
  minute: number
): Date {
  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const timeStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;

  // Start with a UTC guess
  const utcGuess = new Date(`${dateStr}T${timeStr}Z`);

  // Get the offset between UTC and LA time at this approximate time
  const laTime = new Date(
    utcGuess.toLocaleString("en-US", { timeZone: PUBLISH_TIMEZONE })
  );
  const offsetMs = utcGuess.getTime() - laTime.getTime();

  // Adjust to get the actual UTC time for the desired LA local time
  const result = new Date(utcGuess.getTime() + offsetMs);

  // Verify the hour in LA timezone and adjust if DST transition caused a mismatch
  const verifyHour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: PUBLISH_TIMEZONE,
      hour: "2-digit",
      hour12: false,
    }).format(result)
  );

  if (verifyHour !== hour) {
    result.setHours(result.getHours() + (hour - verifyHour));
  }

  return result;
}

/**
 * Find the next available Monday or Friday at 7:00 AM LA time
 * that doesn't already have a scheduled blog post.
 */
export async function findNextAvailableSlot(): Promise<Date> {
  const scheduledRows = await db
    .select({ scheduledAt: blogPosts.scheduledAt })
    .from(blogPosts)
    .where(eq(blogPosts.status, "scheduled"));

  // Build a Set of occupied date strings (YYYY-MM-DD in LA timezone)
  const occupiedDates = new Set<string>();
  for (const row of scheduledRows) {
    if (row.scheduledAt) {
      const laDate = row.scheduledAt.toLocaleDateString("en-CA", {
        timeZone: PUBLISH_TIMEZONE,
      });
      occupiedDates.add(laDate);
    }
  }

  // Start checking from tomorrow
  const candidate = new Date();
  candidate.setDate(candidate.getDate() + 1);

  for (let i = 0; i < 365; i++) {
    // Get the day of the week in LA timezone
    const laDateStr = candidate.toLocaleDateString("en-CA", {
      timeZone: PUBLISH_TIMEZONE,
    });
    const laDay = new Date(
      candidate.toLocaleString("en-US", { timeZone: PUBLISH_TIMEZONE })
    ).getDay();

    if (PUBLISH_DAYS.includes(laDay) && !occupiedDates.has(laDateStr)) {
      const [year, month, day] = laDateStr.split("-").map(Number);
      return getUtcDateForLATime(year, month - 1, day, PUBLISH_HOUR, 0);
    }

    candidate.setDate(candidate.getDate() + 1);
  }

  throw new Error("No available publishing slot found in the next year");
}

/**
 * Schedule a blog post for the next available Monday/Friday slot via QStash
 */
export async function scheduleBlogPost(
  slug: string
): Promise<{ scheduledAt: Date; messageId: string }> {
  const scheduledAt = await findNextAvailableSlot();

  const response = await qstash.publishJSON({
    url: `${APP_URL}/api/qstash/publish-blog`,
    body: { slug },
    notBefore: Math.floor(scheduledAt.getTime() / 1000),
    retries: 5,
  });

  return {
    scheduledAt,
    messageId: response.messageId,
  };
}

/**
 * Cancel a scheduled blog post's QStash message
 */
export async function cancelScheduledBlogPost(
  messageId: string
): Promise<void> {
  try {
    await qstash.messages.delete(messageId);
  } catch (error) {
}
}
