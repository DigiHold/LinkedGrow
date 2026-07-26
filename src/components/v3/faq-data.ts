/**
 * The FAQ, in a module of its own.
 *
 * The visible list and the FAQPage schema must never disagree, so there is one
 * array. It is not inside faq.tsx because that file is a client component and
 * its exports arrive at the server as references rather than as data.
 */
export const V3_FAQS = [
  {
    q: "Will this get my LinkedIn account banned?",
    a: "Nobody in this category can honestly promise it never happens. What we do is start slow, keep human hours, give your account an address nobody else touches, and stop everything the second LinkedIn asks a question. All of it sits on your dashboard rather than hidden in a settings page, so you can watch the guardrails doing their job.",
  },
  {
    q: "Do I need to bring my own AI key?",
    a: "Not for the lead generation, which runs on our AI and is included in the price with no credits to run out of. If you also want it writing your posts, that half uses your own key, and that is exactly what keeps generation unlimited for a few dollars a month.",
  },
  {
    q: "What actually happens when somebody replies?",
    a: "The agent goes permanently silent for that person and emails you within the minute, with their reply, who they are, and the messages you had already sent, so the conversation makes sense without scrolling anywhere. From that point it is yours and the automation never speaks over you.",
  },
  {
    q: "How is this different from every other outreach tool?",
    a: "Three things, and all of them are checkable. Every lead shows you the real post it came from, so you can verify the reasoning yourself. Every message passes a gate that rejects AI-sounding writing before it is allowed to send. And the safety system is visible rather than buried, because your account is worth more than any single campaign.",
  },
  {
    q: "How long before I see something?",
    a: "Leads appear within the first hour. Invitations start the same day at a deliberately low volume, and the first replies usually land in the second week once warm-up has raised the pace. Anyone promising results on day two is skipping the part that keeps your account alive.",
  },
  {
    q: "Can I still use LinkedGrow for writing posts?",
    a: "Yes, and it is in every plan. The generator, the editor, the calendar, carousels and the hook library are all still there, trained on your voice, and they run on your own AI key. The agent handles the outbound half while the publishing half carries on exactly as it does today.",
  },
];
