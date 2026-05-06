---
day: 1
title: "Sign In With LinkedIn Using OpenID Connect in Next.js 16"
description: "The clean OIDC flow for LinkedIn auth in 2026. Real Next.js + NextAuth code, scopes, callback handling, token storage. No outdated v1 references."
tags:
  - nextjs
  - oauth
  - typescript
  - webdev
---

LinkedIn finally moved Sign In to OpenID Connect a while back. Most of the tutorials still floating around the internet show the legacy v1 OAuth dance with `r_liteprofile` and `r_emailaddress` scopes. Those are deprecated. If you copy them, your callback will work for a while and then mysteriously stop, which is the worst kind of bug.

Here is the flow that actually works in 2026 with Next.js 16 and NextAuth v5.

## The scopes you want

Forget `r_liteprofile` and `r_emailaddress`. The current Sign-In product asks for:

```
openid profile email
```

Three scopes, lowercase, space separated. That is the entire request. LinkedIn returns a standard OIDC ID token plus a regular access token. No more profile-specific endpoints, no more email-specific endpoints. The user identity ships in the token claims.

## The provider config in NextAuth v5

NextAuth v5 has a built-in LinkedIn provider, but it ships with the legacy scopes. You need to override it. Here is the working config:

```ts
// src/lib/auth.ts
import LinkedIn from "next-auth/providers/linkedin";

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    LinkedIn({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      issuer: "https://www.linkedin.com",
      authorization: {
        params: { scope: "openid profile email" },
      },
      token: "https://www.linkedin.com/oauth/v2/accessToken",
      userinfo: "https://api.linkedin.com/v2/userinfo",
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
  ],
});
```

The two parts that trip people up: the `userinfo` endpoint is `/v2/userinfo`, not the legacy `/v2/me`, and the `profile.sub` field is what you want as the stable LinkedIn user ID. Do not use `profile.id`. It does not exist on the new endpoint.

## Callback URL

In the LinkedIn Developer Portal, register exactly this:

```
https://your-domain.com/api/auth/callback/linkedin
```

If you forget the trailing path, LinkedIn returns a generic "Bummer, something went wrong" page with no useful debug info, and you will spend forty minutes wondering if you broke your environment variables. Ask me how I know.

## Storing the access token

The OIDC ID token tells you who the user is. The access token lets you call other LinkedIn APIs on their behalf, like posting to their feed. NextAuth v5 hands you both in the `jwt` callback:

```ts
callbacks: {
  async jwt({ token, account }) {
    if (account?.provider === "linkedin") {
      token.linkedinAccessToken = account.access_token;
      token.linkedinExpiresAt = account.expires_at;
    }
    return token;
  },
}
```

Persist `linkedinAccessToken` to your database row for the user, plus the expiry timestamp. LinkedIn's access tokens are valid for 60 days. They do support refresh tokens now, but only if you specifically request the `offline_access` scope, which most apps do not need. For a 60-day window, store it, check the expiry on each use, and re-prompt if expired.

## What you do not get from OIDC

Sign-In gives you identity. It does not give you posting rights. To post on someone's behalf, you need the separate `w_member_social` scope through the "Share on LinkedIn" product. Same OAuth, different consent screen, different scope. Apply for it through the developer portal.

Same story for company page management, feed reading, and the Community Management API. Each is a separate "product" you have to apply for in your LinkedIn app, and each has its own approval queue. Sign-In gets approved instantly. Posting takes a few days. Community APIs take longer and ask for use cases.

## The bug to watch for

LinkedIn caches the consent screen aggressively. If you change scopes in your code and try to test, the user gets sent back to LinkedIn with the OLD consent already granted. The token they return does not include your new scopes. The fix: revoke the existing connection in their LinkedIn account settings, or pass `prompt=consent` in the authorization params:

```ts
authorization: {
  params: { scope: "openid profile email", prompt: "consent" },
}
```

This forces a fresh consent dialog every time. Use it during development, drop it for production.

That is the whole flow. Three scopes, one userinfo endpoint, one callback URL, one access token that lives 60 days. Most of the painful parts of the old LinkedIn OAuth went away when they moved to OIDC. The rest of the painful parts are documented above so you do not have to discover them at 2am.
