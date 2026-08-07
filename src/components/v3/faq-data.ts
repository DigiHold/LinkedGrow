/**
 * The FAQ, in a module of its own.
 *
 * The visible list and the FAQPage schema must never disagree, so there is one
 * array. It is not inside faq.tsx because that file is a client component and
 * its exports arrive at the server as references rather than as data.
 *
 * The first three answer the objection that actually loses the sale, which is
 * not price and not safety: it is that the buyer has already been burned by an
 * automation tool that sprayed strangers and sent sales pitches to people who
 * never asked. Say what is different before saying anything else.
 */
export const V3_FAQS = [
  {
    q: "How is this different from every other outreach tool?",
    a: "Every other tool does what you told it to, forever. You write a search, you write a sequence, and in month 6 it is running the same search and the same sequence with the same results. This one keeps score of its own results instead, and every place it looks is judged on the people it actually brought back: the ones that produce buyers get more of the day and grow new searches of their own, and the ones that stay quiet are dropped with the reason kept. By the second month most of what it hunts was never typed by anybody.",
  },
  {
    q: "Is it just going to spam strangers with sales pitches?",
    a: "No, and refusing to is most of the work. It reads each profile against what you sell before doing anything, and the ones that do not fit are left alone rather than added to a queue. The first message opens a conversation instead of pitching, there is a hard cap on how many times one person is ever written to, and anybody who says no is closed quietly and never contacted again by any of your agents.",
  },
  {
    q: "So the agent actually gets better over time?",
    a: "It does, and this is the only claim on the page you can actually watch happening. Every accepted invitation and every reply teaches it something about your buyer that your own description did not say, and it rewrites what it believes rather than piling notes up. That picture is what it searches and scores against tomorrow morning, so week 8 is not week 1 with more volume, it is a different and much better idea of who is worth your time.",
  },
  {
    q: "What actually happens when somebody replies?",
    a: "The agent reads the reply and decides what kind it is. Ordinary ones it answers itself in your voice, a question about the product, a not right now, a polite brush-off, and the thread keeps going without touching your inbox. When somebody asks for a demo, a call, pricing or is clearly ready to talk, it stops and hands the conversation to you with everything that led there. You can also take over any thread yourself, and the agent stops writing to that person for good.",
  },
  {
    q: "Will this get my LinkedIn account banned?",
    a: "Nobody in this category can honestly promise it never happens. What we do is start slow, keep human hours, give your account an address nobody else touches, and stop everything the second LinkedIn asks a question. All of it sits on your dashboard rather than hidden in a settings page, so you can watch the guardrails doing their job.",
  },
  {
    q: "Do I need to bring my own AI key?",
    a: "Not for the lead generation, which runs on our AI and is included in the price with no credits to run out of. If you also want it writing your posts, that half uses your own key, and that is exactly what keeps generation unlimited for a few dollars a month.",
  },
  {
    q: "How long before I see something?",
    a: "Leads appear within the first hour. Invitations start the same day at a deliberately low volume, and the first replies usually land in the second week once warm-up has raised the pace. Anyone promising you meetings in 48 hours is describing an account that gets restricted in week 3.",
  },
  {
    q: "Can I still use LinkedGrow for writing posts?",
    a: "You can, and it is included in every plan. The generator, the editor, the calendar, carousels and the hook library are all still there, trained on your voice, and they run on your own AI key. The agent handles finding people, and the content side handles being worth finding.",
  },
];
