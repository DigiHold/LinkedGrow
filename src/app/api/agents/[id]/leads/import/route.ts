import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { agents, agentLeads, agentSources } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { loadSessionUser } from "@/lib/auth-user";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Importing a list of people the customer already has.
 *
 * `csv` has been a source type since the agents shipped. It is in the schema,
 * it is in the create-agent allowlist, the agent page has a badge for it that
 * reads "A list you uploaded", and there has never been anywhere to upload one.
 * The worker reaches that case and skips it, correctly, because nothing on
 * LinkedIn needs reading: these rows are the data.
 *
 * Everything else about an imported lead behaves like a mined one. It is
 * claimed against the same unique index, so a person another agent already has
 * is not stolen; it is scored by the same scorer on the next pass, so a
 * competitor on the list is still caught and zeroed; and it enters the same
 * queue behind the same floor. What it skips is only the finding.
 */

/** A pasted list is a person doing an import, not a machine. */
const IMPORT_LIMIT = { windowMs: 60_000, maxRequests: 5 };

/** Enough for a real export, small enough that one paste cannot fill the table. */
const MAX_ROWS = 2_000;
const MAX_BYTES = 1_000_000;

/**
 * One CSV row, split on commas but not inside quotes.
 *
 * Hand-rolled because the file has at most five columns and every one of them
 * is short. A parser dependency for that is not worth the supply chain, and the
 * one shape that genuinely needs quoting is a headline containing a comma,
 * which this handles.
 */
export function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === ",") {
      out.push(field.trim());
      field = "";
    } else field += c;
  }
  out.push(field.trim());
  return out;
}

/**
 * The public profile slug, or null when the cell is not a LinkedIn profile.
 *
 * Parsed with `new URL` rather than matched with `includes`, so a link on a
 * lookalike host cannot walk in. A bare slug is accepted too, because half the
 * exports in the world have one.
 */
export function profileIdFrom(cell: string): string | null {
  const raw = cell.trim();
  if (!raw) return null;
  if (/^[a-z0-9\-_%À-ÿ]{3,100}$/i.test(raw) && !raw.includes(".")) {
    return decodeURIComponent(raw).toLowerCase();
  }
  let url: URL;
  try {
    url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (!/(^|\.)linkedin\.com$/i.test(url.hostname)) return null;
  const slug = url.pathname.match(/\/in\/([^/?#]+)/)?.[1];
  if (!slug) return null;
  return decodeURIComponent(slug).toLowerCase().slice(0, 100);
}

/** Finds a column by any of the names people actually use for it. */
function columnIndex(header: string[], names: string[]): number {
  return header.findIndex((h) => names.includes(h.toLowerCase().replace(/[\s_-]/g, "")));
}

export interface ParsedImport {
  rows: Array<{ profileId: string; profileUrl: string; fullName: string; headline: string; company: string }>;
  skipped: number;
}

/**
 * Reads whatever shape of export was pasted in.
 *
 * The only column that matters is the profile address, because everything else
 * is on the profile and the agent reads it anyway. A file with no header is
 * read as a bare list of addresses, which is what people paste most often.
 */
export function parseImport(text: string): ParsedImport {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, MAX_ROWS + 1);
  if (lines.length === 0) return { rows: [], skipped: 0 };

  const first = splitCsvLine(lines[0] ?? "");
  const hasHeader = columnIndex(first, ["profileurl", "url", "linkedinurl", "profile", "link"]) >= 0;
  const header = hasHeader ? first.map((h) => h.toLowerCase()) : [];
  const urlAt = hasHeader ? columnIndex(first, ["profileurl", "url", "linkedinurl", "profile", "link"]) : 0;
  const nameAt = hasHeader ? columnIndex(first, ["fullname", "name"]) : -1;
  const headlineAt = hasHeader ? columnIndex(first, ["headline", "title", "jobtitle"]) : -1;
  const companyAt = hasHeader ? columnIndex(first, ["company", "organisation", "organization"]) : -1;
  void header;

  const seen = new Set<string>();
  const rows: ParsedImport["rows"] = [];
  let skipped = 0;

  for (const line of lines.slice(hasHeader ? 1 : 0)) {
    const cells = splitCsvLine(line);
    const profileId = profileIdFrom(cells[urlAt] ?? "");
    if (!profileId || seen.has(profileId)) {
      skipped++;
      continue;
    }
    seen.add(profileId);
    const named = nameAt >= 0 ? (cells[nameAt] ?? "").slice(0, 120) : "";
    rows.push({
      profileId,
      profileUrl: `https://www.linkedin.com/in/${profileId}/`,
      // A row with no name still imports. The agent opens the profile before it
      // writes anything, so the name it uses comes from LinkedIn either way,
      // and refusing the row over a missing column would throw away the address.
      fullName: named || profileId.replace(/-+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      headline: headlineAt >= 0 ? (cells[headlineAt] ?? "").slice(0, 300) : "",
      company: companyAt >= 0 ? (cells[companyAt] ?? "").slice(0, 120) : "",
    });
  }
  return { rows, skipped };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limited = rateLimit(`lead-import:${session.user.id}`, IMPORT_LIMIT);
    if (!limited.success) {
      return NextResponse.json(
        { error: "That is a lot of imports at once. Try again in a minute." },
        { status: 429 }
      );
    }

    const data = await loadSessionUser(session.user.id);
    if (!data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const workspaceId = data.teamOwnerId ?? data.user.id;

    // Ownership in the WHERE, so an agent id from another workspace matches
    // nothing rather than being imported into on their behalf.
    const [agent] = await db
      .select({ id: agents.id })
      .from(agents)
      .where(and(eq(agents.id, id), eq(agents.workspaceId, workspaceId)))
      .limit(1);
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const body = await request.json();
    const csv = typeof body?.csv === "string" ? body.csv : "";
    const name = typeof body?.name === "string" ? body.name.trim().slice(0, 80) : "";
    if (!csv.trim()) {
      return NextResponse.json({ error: "There was nothing in that file" }, { status: 400 });
    }
    if (csv.length > MAX_BYTES) {
      return NextResponse.json(
        { error: `That file is too big. Split it into parts of ${MAX_ROWS} people or fewer.` },
        { status: 400 }
      );
    }

    const { rows, skipped } = parseImport(csv);
    if (rows.length === 0) {
      return NextResponse.json(
        {
          error:
            "No LinkedIn profile addresses were found in that file. It needs a column of addresses like https://www.linkedin.com/in/their-name.",
        },
        { status: 400 }
      );
    }

    const now = new Date();
    const label = name || `Imported list, ${rows.length} people`;
    const sourceId = crypto.randomUUID();
    await db.insert(agentSources).values({
      id: sourceId,
      workspaceId,
      agentId: id,
      type: "csv",
      label,
      // Never mined, because there is nothing on LinkedIn to open: the rows are
      // inserted below and the source row exists so the leads have a home the
      // customer recognises on the Sources tab.
      enabled: false,
      leadsFound: rows.length,
      createdAt: now,
      updatedAt: now,
    });

    /**
     * Inserted in batches, ignoring anybody already claimed.
     *
     * `onConflictDoNothing` against the (workspace, profile) index is the same
     * claim the worker uses, so importing a list that overlaps another agent's
     * leads quietly keeps whoever had them first rather than moving them.
     */
    let imported = 0;
    for (let i = 0; i < rows.length; i += 200) {
      const batch = rows.slice(i, i + 200).map((r) => ({
        id: crypto.randomUUID(),
        workspaceId,
        agentId: id,
        sourceId,
        profileId: r.profileId,
        profileUrl: r.profileUrl,
        fullName: r.fullName,
        headline: r.headline || null,
        company: r.company || null,
        signalType: "csv:import",
        signalText: `From the list you uploaded, ${label}`,
        step: "found" as const,
        sequenceStatus: "queued",
        foundAt: now,
        stepAt: now,
        createdAt: now,
        updatedAt: now,
      }));
      const done = await db
        .insert(agentLeads)
        .values(batch)
        .onConflictDoNothing()
        .returning({ id: agentLeads.id });
      imported += done.length;
    }

    return NextResponse.json({
      imported,
      // Said plainly rather than hidden, because "we imported 40 of your 300"
      // with no explanation is how a customer concludes the product is broken.
      alreadyKnown: rows.length - imported,
      unreadable: skipped,
      sourceId,
    });
  } catch {
    return NextResponse.json({ error: "Failed to import that list" }, { status: 500 });
  }
}
