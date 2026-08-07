/**
 * Builds the demo workspace the home-page clips are filmed in.
 *
 * Every screen in those clips is the real dashboard; only the contents are
 * invented, the same way the feature-page screenshots were made. Run it again
 * and it rebuilds from scratch: every row it writes carries a `demo-` id, and
 * those are the only rows it ever deletes.
 *
 *   npx tsx scripts/seed-demo-agent.mts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
const { db, users, linkedinAccounts, proxyAllocations, agents, agentSources, agentLeads, agentQueue, agentMessages, agentActivity } = await import("../src/lib/db");
const { encrypt } = await import("../src/lib/encryption");
const { eq } = await import("drizzle-orm");

const EMAIL = "demo.video+v1@linkedgrow.ai";
const ACC = "demo-acc-1";
const AG = "demo-agent-1";
const now = new Date();
const ago = (h: number) => new Date(now.getTime() - h * 3600_000);
const ahead = (h: number) => new Date(now.getTime() + h * 3600_000);

const [me] = await db.select({ id: users.id }).from(users).where(eq(users.email, EMAIL));
if (!me) throw new Error("demo user not found: " + EMAIL);
const ws = me.id;

await db.delete(agentActivity).where(eq(agentActivity.agentId, AG));
await db.delete(agentMessages).where(eq(agentMessages.agentId, AG));
await db.delete(agentQueue).where(eq(agentQueue.agentId, AG));
await db.delete(agentLeads).where(eq(agentLeads.agentId, AG));
await db.delete(agentSources).where(eq(agentSources.agentId, AG));
await db.delete(agents).where(eq(agents.id, AG));
/* the account points at the address and the address points back, so the link
   is cut before either row goes */
await db.update(linkedinAccounts).set({ proxyAllocationId: null }).where(eq(linkedinAccounts.id, ACC));
await db.delete(proxyAllocations).where(eq(proxyAllocations.id, "demo-proxy-1"));
await db.delete(linkedinAccounts).where(eq(linkedinAccounts.id, ACC));

await db.insert(linkedinAccounts).values({
  id: ACC, workspaceId: ws, createdBy: ws,
  email: "alex@northwindlabs.io", passwordEncrypted: encrypt("not-a-real-password"),
  profileId: "ACoAAB7demo", profileUrl: "https://www.linkedin.com/in/alex-mercier-nw/",
  fullName: "Alex Mercier", headline: "Founder at Northwind Labs · B2B SaaS",
  country: "FR", status: "active", warmupStartedAt: ago(24 * 34), dailyInviteCap: 42,
  lastCheckAt: ago(1), createdAt: ago(24 * 35), updatedAt: ago(1),
});

await db.insert(proxyAllocations).values({
  id: "demo-proxy-1", workspaceId: ws, country: "FR", provider: "managed",
  host: "fr.res.proxy.net", port: 9114,
  usernameEncrypted: encrypt("demo-user"), passwordEncrypted: encrypt("demo-pass"),
  status: "active", source: "managed", linkedinAccountId: ACC,
  lastCheckedAt: ago(2), lastExitIp: "88.164.203.17", lastAsnOrg: "Orange S.A.",
  registryCountry: "FR", exitLooksHosted: false,
  createdAt: ago(24 * 35), updatedAt: ago(2),
});
await db.update(linkedinAccounts).set({ proxyAllocationId: "demo-proxy-1" }).where(eq(linkedinAccounts.id, ACC));

await db.insert(agents).values({
  id: AG, workspaceId: ws, createdBy: ws, linkedinAccountId: ACC,
  name: "SaaS founders", status: "active",
  website: "northwindlabs.io",
  icpSummary: "Founders and growth leads at small B2B SaaS companies who sell to other businesses and still run outbound themselves.",
  jobRoles: "Founder, CEO, Co-founder, Head of Growth, Growth Marketer, Head of Sales",
  industries: "SaaS, Technology, Marketing and Advertising, Consulting",
  locations: "United Kingdom, France, Switzerland, Netherlands, Germany",
  companySizes: "1-10, 11-50, 51-200",
  matchLevel: "balanced", goal: "conversations", tone: "conversational",
  memory: "Founders who run outbound themselves answer far more often than heads of sales at the same company size. Posts about reply rates outperform posts about tooling. Nobody under 10 people has budget before month two.",
  memoryRev: 7, memoryAt: ago(9),
  timezone: "Europe/Paris", workdayStart: 9 * 60, workdayEnd: 18 * 60, workdayDays: "[1,2,3,4,5]",
  smartLeadFinder: true, lastRunAt: ago(1),
  createdAt: ago(24 * 34), updatedAt: ago(1),
});

/* Sources. The two the agent grew itself are marked `learned`, and the one it
   killed keeps the reason, because that is the whole story of the section. */
const SOURCES: [string, string, string, string, number, number, number, number, number][] = [
  ["demo-src-1", "competitor", "Dripify", "customer", 172, 76, 51, 18, 7],
  ["demo-src-2", "competitor", "Lemlist", "customer", 148, 64, 42, 14, 5],
  ["demo-src-3", "keyword", "cold outreach reply rate", "learned", 121, 55, 38, 15, 6],
  ["demo-src-4", "buying_event", "Just changed role", "customer", 96, 41, 27, 9, 4],
  ["demo-src-5", "keyword", "sales navigator alternative", "learned", 78, 32, 20, 5, 2],
];
for (const [id, type, label, origin, found, contacted, accepted, replied, good] of SOURCES) {
  await db.insert(agentSources).values({
    id, workspaceId: ws, agentId: AG, type: type as "competitor",
    label, origin: origin as "customer", enabled: true,
    leadsFound: found, contacted, accepted, replied, goodLeads: good,
    lastMinedAt: ago(2), createdAt: ago(24 * 34), updatedAt: ago(2),
  });
}
await db.insert(agentSources).values({
  id: "demo-src-6", workspaceId: ws, agentId: AG, type: "keyword",
  label: "linkedin automation", origin: "learned", enabled: false,
  leadsFound: 25, contacted: 10, accepted: 4, replied: 0, goodLeads: 0, passes: 3,
  retiredAt: ago(72), retiredReason: "24 people contacted, nobody answered. Dropped so the day goes somewhere warmer.",
  lastMinedAt: ago(72), createdAt: ago(24 * 30), updatedAt: ago(72),
});

/* The people. Invented, and deliberately not modelled on anyone. */
type L = [string, string, string, string, string, string, number, string, string, string, string, number];
const LEADS: L[] = [
  ["demo-l-1", "Elena Marchetti", "Head of Growth at Fleetwise", "Head of Growth", "Fleetwise", "Milan, Italy", 96, "replied", "Asked what our reply rates look like against a real list", "demo-src-3", "comment", 2],
  ["demo-l-2", "Tom Bakker", "Founder at Kettle Analytics", "Founder", "Kettle Analytics", "Amsterdam, Netherlands", 94, "replied", "Said their SDR left and outbound has stopped since", "demo-src-1", "comment", 5],
  ["demo-l-3", "Clara Wenger", "Co-founder at Tellwell", "Co-founder", "Tellwell", "Zurich, Switzerland", 92, "replied", "Complained that every tool she tried sends the same template", "demo-src-3", "post", 9],
  ["demo-l-4", "James Okafor", "Head of Sales at Northbound", "Head of Sales", "Northbound", "London, United Kingdom", 91, "accepted", "Engaged with a Dripify post about connection limits", "demo-src-1", "reaction", 14],
  ["demo-l-5", "Nadia Haddad", "Head of Growth at Loomstack", "Head of Growth", "Loomstack", "Paris, France", 90, "accepted", "Started as Head of Growth eleven days ago", "demo-src-4", "job_change", 17],
  ["demo-l-6", "Oliver Reid", "Founder at Sixthline", "Founder", "Sixthline", "Manchester, United Kingdom", 89, "messaged", "Asked the room for a Sales Navigator alternative", "demo-src-5", "post", 20],
  ["demo-l-7", "Sofia Almeida", "Co-founder at Palette HQ", "Co-founder", "Palette HQ", "Lisbon, Portugal", 88, "messaged", "Commented on a Lemlist post about deliverability", "demo-src-2", "comment", 23],
  ["demo-l-8", "Daniel Roth", "Founder at Casefold", "Founder", "Casefold", "Berlin, Germany", 86, "invited", "Posted that cold email has stopped working for them", "demo-src-3", "post", 26],
  ["demo-l-9", "Hanna Virtanen", "Growth Lead at Kaskade", "Growth Lead", "Kaskade", "Helsinki, Finland", 85, "invited", "Reacted to a thread about outbound reply rates", "demo-src-3", "reaction", 29],
  ["demo-l-10", "Marc Dubois", "CEO at Arpege", "CEO", "Arpege", "Lyon, France", 84, "invited", "Engaged twice this week with a Dripify customer story", "demo-src-1", "reaction", 31],
  ["demo-l-11", "Aisha Rahman", "Head of Revenue at Quaystone", "Head of Revenue", "Quaystone", "London, United Kingdom", 82, "queued", "Just moved from Head of Sales to Head of Revenue", "demo-src-4", "job_change", 34],
  ["demo-l-12", "Lukas Meyer", "Founder at Streamline Ops", "Founder", "Streamline Ops", "Vienna, Austria", 81, "queued", "Asked which tool people use instead of Sales Navigator", "demo-src-5", "comment", 36],
  ["demo-l-13", "Petra Novak", "Co-founder at Bramble", "Co-founder", "Bramble", "Prague, Czechia", 79, "queued", "Commented on a Lemlist post about sequence fatigue", "demo-src-2", "comment", 38],
  ["demo-l-14", "Iris Andersen", "Growth Lead at Northlight", "Growth Lead", "Northlight", "Copenhagen, Denmark", 78, "found", "Posted about hiring a first SDR and dreading it", "demo-src-3", "post", 40],
  ["demo-l-15", "Ruben Costa", "Founder at Halyard", "Founder", "Halyard", "Porto, Portugal", 76, "found", "Reacted to a post about connection request limits", "demo-src-1", "reaction", 42],
  ["demo-l-16", "Maja Lindqvist", "Head of Growth at Ferrix", "Head of Growth", "Ferrix", "Stockholm, Sweden", 74, "found", "Asked how people warm a brand new LinkedIn account", "demo-src-5", "comment", 44],
];
const STATE: Record<string, string> = {
  found: "Found", queued: "Waiting to be invited", invited: "Invitation sent",
  accepted: "Connected", messaged: "First note sent", replied: "Answered you",
};
for (const [id, name, headline, title, company, loc, score, step, signal, src, kind, hrs] of LEADS) {
  const slug = name.toLowerCase().replace(/[^a-z]+/g, "-") + "-" + id.slice(-2) + "x";
  await db.insert(agentLeads).values({
    id, workspaceId: ws, agentId: AG, sourceId: src,
    profileId: "ACoAA" + id, profileUrl: `https://www.linkedin.com/in/${slug}/`,
    fullName: name, headline, jobTitle: title, company, location: loc,
    matchScore: score,
    matchReason: `${title} at a ${company.length < 12 ? "small" : "growing"} SaaS company in your size range, in ${loc.split(",")[1].trim()}, and the topic matches what you sell.`,
    signalType: kind, signalText: signal,
    signalUrl: `https://www.linkedin.com/feed/update/urn:li:activity:73${(9100000000000 + hrs * 7919).toString().slice(0, 11)}/`,
    signalAuthor: kind === "job_change" ? name : "Dripify",
    step: step as "found", sequenceStatus: STATE[step], stepAt: ago(hrs),
    foundAt: ago(hrs + 6), createdAt: ago(hrs + 6), updatedAt: ago(hrs),
  });
}

/* The rest of the book. The sixteen above carry the readable signals and sit
   at the top of the list; these fill it out so the counters on the overview
   are the size a month of work actually produces. */
const FIRST = "Anna Marco Julia Pieter Nora Felix Ines Rasmus Chiara Jonas Lea Viktor Amelie Stefan Noor Emil Sara Lucas Freya Matteo Katrin Bruno Elin Tobias Camille Anton Maja Henri Alice Gustav Rosa Milan Ada Kasper Livia Otto Nina Rafael Vera Samuel".split(" ");
const LAST = "Keller Silva Janssen Moreau Lindberg Weber Rossi Nielsen Dupont Vogel Hansen Ferrari Novak Blom Laurent Berger Kowalski Ruiz Aalto Brandt Faber Costa Ivanov Steiner Mercer Halvorsen Bianchi Devries Larsen Renard Kraus Olsen Marchand Nyberg Fischer Duarte Palmer Sandberg Leclerc Wirth".split(" ");
const CO = "Fleetwise Kettle Tellwell Northbound Loomstack Sixthline Palette Casefold Kaskade Arpege Quaystone Streamline Bramble Northlight Halyard Ferrix Cadence Beacon Orbit Trellis Vantage Meridian Fathom Kindling Ledger Harbour Pivotal Signal Thornbury Waypoint".split(" ");
const TITLES = ["Founder", "Co-founder", "CEO", "Head of Growth", "Growth Lead", "Head of Sales", "Head of Revenue", "Growth Marketer"];
const CITY = ["London, United Kingdom", "Paris, France", "Berlin, Germany", "Amsterdam, Netherlands", "Zurich, Switzerland", "Milan, Italy", "Madrid, Spain", "Stockholm, Sweden", "Dublin, Ireland", "Copenhagen, Denmark", "Lisbon, Portugal", "Vienna, Austria"];
const SIG: [string, string][] = [
  ["comment", "Commented on a post about outbound reply rates"],
  ["reaction", "Reacted to a competitor's customer story"],
  ["post", "Posted about hiring their first salesperson"],
  ["comment", "Asked which tool people use instead of Sales Navigator"],
  ["job_change", "Changed role in the last ninety days"],
  ["post", "Wrote that cold email has stopped working for them"],
  ["reaction", "Reacted twice this week to posts about connection limits"],
  ["comment", "Complained about templated outreach in a public thread"],
];
const MIX: [string, number][] = [["found", 320], ["queued", 42], ["invited", 96], ["accepted", 87], ["messaged", 34], ["replied", 61]];
const SRC = ["demo-src-1", "demo-src-2", "demo-src-3", "demo-src-4", "demo-src-5"];
const bulk: (typeof agentLeads.$inferInsert)[] = [];
let k = 0;
for (const [step, count] of MIX) {
  for (let i = 0; i < count; i++) {
    k++;
    const first = FIRST[(k * 7) % FIRST.length], last = LAST[(k * 13) % LAST.length];
    const co = CO[(k * 11) % CO.length], title = TITLES[(k * 5) % TITLES.length];
    const loc = CITY[(k * 3) % CITY.length];
    const [kind, text] = SIG[(k * 17) % SIG.length];
    const hrs = 50 + ((k * 29) % 640);
    const score = 62 + ((k * 23) % 32);
    bulk.push({
      id: `demo-g-${k}`, workspaceId: ws, agentId: AG, sourceId: SRC[(k * 3) % SRC.length],
      profileId: `ACoAAg${k}`, profileUrl: `https://www.linkedin.com/in/${first.toLowerCase()}-${last.toLowerCase()}-${k}z/`,
      fullName: `${first} ${last}`, headline: `${title} at ${co}`, jobTitle: title, company: co, location: loc,
      matchScore: score,
      matchReason: `${title} at a SaaS company in your size range, in ${loc.split(",")[1].trim()}, and the topic matches what you sell.`,
      signalType: kind, signalText: text,
      signalUrl: `https://www.linkedin.com/feed/update/urn:li:activity:73${(9100000000000 + k * 7919).toString().slice(0, 11)}/`,
      signalAuthor: kind === "job_change" ? `${first} ${last}` : "Dripify",
      step: step as "found", sequenceStatus: STATE[step], stepAt: ago(hrs),
      foundAt: ago(hrs + 6), createdAt: ago(hrs + 6), updatedAt: ago(hrs),
    });
  }
}
for (let i = 0; i < bulk.length; i += 80) await db.insert(agentLeads).values(bulk.slice(i, i + 80));

/* Tomorrow morning's queue, readable and editable tonight. */
const QUEUE: [string, string, string, string, number][] = [
  ["demo-q-1", "demo-l-11", "intro", "Aisha, congratulations on the new title. Most people I speak to inherit a pipeline they did not build and spend the first month working out which half is real. How are you finding it so far?", 14],
  ["demo-q-2", "demo-l-12", "intro", "Lukas, you asked what people use instead of Sales Navigator. I stopped paying for it last year and have not missed it once, happy to tell you what replaced it if that is useful.", 15],
  ["demo-q-3", "demo-l-13", "intro", "Petra, your point about sequence fatigue is the reason I stopped writing sequences at all. Curious whether you have found anything that still gets answered.", 16],
  ["demo-q-4", "demo-l-14", "invite", "", 17],
  ["demo-q-5", "demo-l-15", "invite", "", 18],
  ["demo-q-6", "demo-l-16", "visit", "", 19],
];
for (const [id, lead, action, body, h] of QUEUE) {
  await db.insert(agentQueue).values({
    id, workspaceId: ws, agentId: AG, leadId: lead,
    action: action as "intro", messageBody: body || null, state: "pending",
    scheduledAt: ahead(h), createdAt: ago(2), updatedAt: ago(2),
  });
}

/* Three conversations, so the Messages tab has something to read. */
const THREADS: [string, string, string, number][] = [
  ["demo-m-1", "demo-l-1", "out", 30],
  ["demo-m-2", "demo-l-1", "in", 26],
  ["demo-m-3", "demo-l-1", "out", 25],
  ["demo-m-4", "demo-l-2", "out", 21],
  ["demo-m-5", "demo-l-2", "in", 18],
  ["demo-m-6", "demo-l-3", "out", 16],
  ["demo-m-7", "demo-l-3", "in", 12],
  ["demo-m-8", "demo-l-3", "out", 11],
];
const BODY: Record<string, string> = {
  "demo-m-1": "Elena, you asked what reply rates look like on a real list rather than a demo. Ours sit around a quarter, and the whole trick is that the first message quotes something the person actually wrote. Happy to show you the numbers behind that.",
  "demo-m-2": "That is a lot higher than anything we get. What counts as a reply in that number, and how big is the list?",
  "demo-m-3": "Fair question. It is anybody who writes back at all, including the polite no, on a list of about four hundred a month. Meetings out of that are far smaller, roughly one in nine replies.",
  "demo-m-4": "Tom, you mentioned your SDR left and outbound stopped with them. That is the part nobody plans for. What did you end up doing with the list they were working?",
  "demo-m-5": "Honestly nothing, it has been sitting in a spreadsheet since March. Can you send me something I can read this week?",
  "demo-m-6": "Clara, your line about every tool sending the same template is the reason I stopped using them. Curious what you tried before you gave up on it.",
  "demo-m-7": "Three of them. All of them wanted me to write the sequence, which is the part I am bad at. Does yours actually write from the person or is that marketing?",
  "demo-m-8": "It writes from whatever they posted or commented on, and it shows you the post it used. You can read tomorrow's messages tonight and rewrite any of them.",
};
for (const [id, lead, dir, h] of THREADS) {
  await db.insert(agentMessages).values({
    id, workspaceId: ws, agentId: AG, leadId: lead,
    direction: dir as "out", step: dir === "out" ? "intro" : null,
    body: BODY[id], sentAt: ago(h), readAt: dir === "in" ? ago(h - 1) : null,
    createdAt: ago(h),
  });
}

await db.insert(agentActivity).values({
  agentId: AG, workspaceId: ws, verb: "Reading a post by",
  subjectName: "Iris Andersen", subjectUrl: "https://www.linkedin.com/in/iris-andersen-14x/",
  detail: "Northlight · Copenhagen", startedAt: ago(0.02), beatAt: now,
});

console.log(`seeded workspace ${ws}: 1 account, 1 agent, ${SOURCES.length + 1} sources, ${LEADS.length + bulk.length} leads, ${QUEUE.length} queued, ${THREADS.length} messages`);
process.exit(0);
