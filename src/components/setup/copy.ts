/**
 * The approved setup wizard copy, word for word.
 *
 * A plain module on purpose: the server page renders the non admin card from
 * it, and a value exported from a "use client" file reaches a server
 * component as a client reference, not as an object.
 */
export const COPY = {
  instance: {
    heading: "Your instance",
    intro:
      "Give this LinkedGrow installation a name and confirm the address people will type to open it. The timezone becomes the default for reports and for every agent you create later.",
  },
  ai: {
    heading: "The key your agents think with",
    intro:
      "Pick a provider and paste one API key. This key runs the agents: finding people, judging fit, writing messages. It also reads your website in the agent wizard, and it fills your own AI settings when those are still empty, so the post generator works straight away. The agents always use this key, and everyone else on the instance adds a key of their own in Settings.",
  },
  proxy: {
    heading: "One address per LinkedIn account",
    intro:
      "LinkedIn compares where an account signs in from with where it always has. Each account you connect gets its own residential or ISP address in its own country, and it keeps that address for good. You can buy addresses through Proxy-Seller with your own account, or bring a proxy you already own.",
    skip: "You can skip this step, but no agent will start until an address exists. The key can be added later in Settings, Instance.",
  },
  email: {
    heading: "Email, for notifications only",
    intro:
      "LinkedGrow emails you when a lead replies, when LinkedIn asks for a verification code, when an agent stops, and once a week with the people it found. Skip this and everything still shows in the dashboard.",
  },
  storage: {
    heading: "Where files live",
    intro:
      "Images and carousels attached to posts live here. Local disk keeps them in the uploads volume of this install, which is the right choice for one server. S3 compatible storage such as Cloudflare R2, MinIO or AWS works when you want files off the server or across several.",
  },
  review: {
    heading: "Check it, then finish",
    signups: "Only people you invite from the Team page can create an account. You can reopen sign ups later in Settings, Instance.",
    note: "Everything on this page can be changed later in Settings, Instance. The next screen creates your first agent.",
  },
  nonAdmin: {
    heading: "This instance is still being set up",
    text: "The administrator has to finish the setup before anyone else can use LinkedGrow. Come back once they have, or ask them to invite you from the Team page.",
  },
} as const;
