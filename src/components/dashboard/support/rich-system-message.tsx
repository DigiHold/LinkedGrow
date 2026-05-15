// Renders the rich content for system messages in support tickets:
//   - review_request : the 3 Google/Trustpilot/G2 brand-logo cards
//   - thank_you      : a thank-you panel with "Open another ticket" CTA
//   - auto_close     : the 14-day auto-close notice
//   - text (default) : plain prose
//
// Used on both the user and admin ticket detail pages so the same content
// renders identically on both sides of the conversation.

import Link from "next/link";
import { Star, Sparkles, Plus, MessageCircle } from "lucide-react";

interface RichSystemMessageProps {
  kind?: "text" | "review_request" | "thank_you" | "auto_close";
  body: string;
}

const REVIEW_LINKS = [
  {
    href: "https://g.page/r/CchpLmmQPKcZEAI/review?utm_source=linkedgrow&utm_medium=support_ticket",
    label: "Review us on Google",
    logo: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
    ),
  },
  {
    href: "https://www.trustpilot.com/review/linkedgrow.ai?utm_source=linkedgrow&utm_medium=support_ticket",
    label: "Review us on Trustpilot",
    logo: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="28" height="28">
        <path d="M240,91.7177h-91.6463L120.0457,0l-28.3994,91.7237-91.6463-.0962,74.2226,56.745-28.3994,91.6275,74.2226-56.6488,74.1311,56.6488-28.3079-91.6275,74.1311-56.6548Z" fill="#00b67a" />
        <path d="M172.237,169.1169l-6.3681-20.7444-45.8232,34.9787,52.1913-14.2343Z" fill="#005128" />
      </svg>
    ),
  },
  {
    href: "https://www.g2.com/products/linkedgrow/reviews?utm_source=linkedgrow&utm_medium=support_ticket",
    label: "Review us on G2",
    logo: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 512" width="28" height="28">
        <path d="M350.3667,364.7733c18.8338,32.6825,37.4575,64.994,56.0672,97.2704-82.4065,63.0896-210.616,70.7141-305.527-1.9394C-8.3149,376.4306-26.2665,233.6582,32.2092,130.8846,99.4646,12.6731,225.3217-13.4702,306.3559,5.6997c-2.1914,4.761-50.7251,105.448-50.7251,105.448,0,0-3.8368.2521-6.0072.2941-23.9518,1.0152-41.7913,6.5883-60.9122,16.4743-42.5955,22.2267-71.4016,64.1245-76.9033,111.8543-2.8272,23.8393.4692,48.0058,9.5779,70.217,7.7015,18.7778,18.5957,35.4551,33.2006,49.5349,22.4045,21.6203,49.0658,35.007,79.97,39.4389,29.2658,4.2008,57.4115.042,83.7857-13.2116,9.893-4.964,18.3086-10.4461,28.1456-17.9656,1.2533-.8121,2.3665-1.8414,3.8788-3.0106h0Z" fill="#ff492c" />
        <path d="M350.5487,78.1431c-4.7819-4.7049-9.2138-9.0458-13.6247-13.4147-2.6325-2.6045-5.167-5.3141-7.8626-7.8556-.9662-.9172-2.1004-2.1704-2.1004-2.1704,0,0,.9172-1.9464,1.3093-2.7445,5.16-10.3551,13.2467-17.9236,22.8386-23.9448,10.6068-6.7088,22.9646-10.1223,35.5111-9.809,16.0542.3151,30.9812,4.3129,43.5767,15.081,9.2979,7.9466,14.0658,18.0286,14.906,30.064,1.4003,20.3041-7.0014,35.8542-23.6857,46.7063-9.802,6.3853-20.374,11.3213-30.9742,17.1674-5.8461,3.2276-10.8452,6.0632-16.5583,11.9024-5.027,5.8602-5.2721,11.3843-5.2721,11.3843l75.9441-.098v33.8238h-117.2244v-3.2697c-.4481-16.6213,1.4913-32.2624,9.1018-47.3575,7.0014-13.8488,17.8816-23.9868,30.9532-31.7933,10.068-6.0142,20.6681-11.1322,30.7571-17.1184,6.2243-3.6897,10.6211-9.1018,10.5861-16.9504,0-6.7353-4.901-12.7215-11.9024-14.5909-16.5093-4.4529-33.3127,2.6535-42.0504,17.7625-1.2743,2.2054-2.5765,4.3969-4.2288,7.2254h0ZM497.445,328.8212l-63.9998-110.524h-126.6483l-64.4129,111.6653h127.5794l62.9566,109.9989,64.5249-111.1402Z" fill="#ff492c" />
      </svg>
    ),
  },
];

export function RichSystemMessage({ kind = "text", body }: RichSystemMessageProps) {
  if (kind === "review_request") {
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Star className="w-4 h-4 text-white fill-current" />
          </div>
          <span className="font-semibold text-sm">Could you leave us a review?</span>
        </div>
        <p className="text-sm leading-relaxed mb-4">{body}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {REVIEW_LINKS.map((r) => (
            <a
              key={r.href}
              href={r.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-900 hover:border-cyan-400 dark:hover:border-cyan-500 hover:shadow-sm transition-all text-sm font-medium"
            >
              {r.logo}
              <span className="text-slate-700 dark:text-slate-200">{r.label}</span>
            </a>
          ))}
        </div>
      </div>
    );
  }

  if (kind === "thank_you") {
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-sm">Thanks for reaching out!</span>
        </div>
        <p className="text-sm leading-relaxed mb-4">{body}</p>
        <Link
          href="/dashboard/support"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-linear-to-r from-cyan-500 to-blue-600 text-white text-sm font-medium hover:from-cyan-600 hover:to-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Open another ticket
        </Link>
      </div>
    );
  }

  if (kind === "auto_close") {
    return (
      <div>
        <div className="flex items-center gap-2 mb-2 font-medium">
          <MessageCircle className="w-4 h-4" /> Closed automatically
        </div>
        <p className="text-sm leading-relaxed">{body}</p>
      </div>
    );
  }

  // Default text system message
  return (
    <>
      <div className="flex items-center gap-2 mb-1.5 font-medium">
        <MessageCircle className="w-4 h-4" /> System
      </div>
      <div className="whitespace-pre-wrap text-sm leading-relaxed">{body}</div>
    </>
  );
}
