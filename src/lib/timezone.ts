/**
 * Timezone utility functions for scheduling posts
 *
 * When a user schedules a post for "9:00 AM" in their configured timezone (e.g., America/Los_Angeles),
 * we need to convert that to UTC for storage and QStash scheduling.
 */

/**
 * Convert a local date/time string in a specific timezone to UTC ISO string
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param timeStr - Time string in HH:MM format
 * @param timezone - IANA timezone (e.g., "America/Los_Angeles", "Europe/Paris")
 * @returns ISO string in UTC
 *
 * Example:
 * - User in settings has timezone "America/Los_Angeles"
 * - User schedules post for 2026-02-02 at 09:00
 * - This function returns "2026-02-02T17:00:00.000Z" (9 AM LA = 5 PM UTC)
 */
export function localToUTC(dateStr: string, timeStr: string, timezone: string): string {
  // Create a date string that we'll interpret in the user's timezone
  const localDateTimeStr = `${dateStr}T${timeStr}:00`;

  // Use Intl.DateTimeFormat to get the UTC offset for the given timezone at that date/time
  // This handles DST correctly
  const date = new Date(localDateTimeStr);

  // Get the parts in the target timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  // Parse what the date looks like in the target timezone
  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '0';

  // The difference between what we wanted and what we got tells us the offset
  const wantedDate = new Date(localDateTimeStr);
  const gotDate = new Date(
    `${getPart('year')}-${getPart('month')}-${getPart('day')}T${getPart('hour')}:${getPart('minute')}:${getPart('second')}`
  );

  // Calculate offset and adjust
  const offsetMs = wantedDate.getTime() - gotDate.getTime();
  const utcDate = new Date(date.getTime() + offsetMs);

  return utcDate.toISOString();
}

/**
 * Convert a UTC date to a local date/time in a specific timezone
 *
 * @param utcDate - Date object or ISO string in UTC
 * @param timezone - IANA timezone (e.g., "America/Los_Angeles", "Europe/Paris")
 * @returns Object with date (YYYY-MM-DD) and time (HH:MM) in the target timezone
 */
export function utcToLocal(utcDate: Date | string, timezone: string): { date: string; time: string } {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return {
    date: formatter.format(date), // YYYY-MM-DD format
    time: timeFormatter.format(date), // HH:MM format
  };
}

/**
 * Get the current date and time in a specific timezone
 *
 * @param timezone - IANA timezone
 * @returns Object with date (YYYY-MM-DD) and time (HH:MM)
 */
export function getNowInTimezone(timezone: string): { date: string; time: string } {
  return utcToLocal(new Date(), timezone);
}

/**
 * Format a UTC date for display in the user's timezone
 *
 * @param utcDate - Date object or ISO string in UTC
 * @param timezone - IANA timezone
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatInTimezone(
  utcDate: Date | string,
  timezone: string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
): string {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;

  return new Intl.DateTimeFormat('en-US', {
    ...options,
    timeZone: timezone,
  }).format(date);
}
