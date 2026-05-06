---
day: 3
title: "Posting to LinkedIn From Node.js: 7 API Quirks That Burned Me"
description: "Token urns, image upload dance, the empty-body 422, retries, rate limits, scope confusion, and the consent cache. Things the LinkedIn API docs do not warn you about."
tags:
  - api
  - nodejs
  - linkedin
  - webdev
---

I built a tool that posts to LinkedIn programmatically. Here is the list of things I wish I had known before I started, with code where it helps. None of these are documented prominently. All of them cost me an evening or two.

## 1. Author URN, not user ID

When you create a UGC post, the API does not accept a user ID. It accepts a URN like `urn:li:person:abc123`. If you store the LinkedIn user ID as a string and try to send it directly, you get a `INVALID_AUTHOR` error with no further detail.

```ts
const authorUrn = `urn:li:person:${user.linkedinProfileId}`;
```

For company pages, it is `urn:li:organization:12345`. You must store the URN type along with the ID, or compute it at request time based on whether you are posting as a person or a company.

## 2. The image upload is three calls, not one

You cannot just send a base64 image in the post body. The flow is:

1. POST `/rest/images?action=initializeUpload` with the author URN. Response includes an `uploadUrl` and an `image` URN.
2. PUT the binary image bytes to that `uploadUrl`. No auth header. LinkedIn's signed URL handles auth.
3. POST your share with the image URN in the `media` field.

```ts
// Step 1
const init = await fetch(
  "https://api.linkedin.com/rest/images?action=initializeUpload",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "LinkedIn-Version": "202401",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      initializeUploadRequest: { owner: authorUrn },
    }),
  }
);
const { value } = await init.json();
const uploadUrl = value.uploadUrl;
const imageUrn = value.image;

// Step 2 — note: no auth header on the PUT
await fetch(uploadUrl, { method: "PUT", body: imageBuffer });

// Step 3 — use imageUrn in your share
```

If you skip the `LinkedIn-Version` header, you get a 400 with no explanation. The version is a date string, not a semver.

## 3. Empty body returns 422, not 400

If you POST a share with `commentary` set to an empty string, LinkedIn returns 422 Unprocessable Entity. If you omit `commentary` entirely, you also get 422. The error message says nothing useful. The fix is to always send at least one space if the user wanted an image-only post:

```ts
commentary: text?.trim() || " ",
```

## 4. Rate limits are silent

There is no `X-RateLimit-Remaining` header. There is no documented per-user limit. Your app has a daily quota you can see in the developer portal, but per-user behavior is enforced at LinkedIn's discretion. If you post too fast on the same user account, you start getting 429 errors with a generic message. Back off exponentially. Plan for 5 to 10 posts per user per day as a soft ceiling, even if your own users would never hit that.

## 5. Token expiry is real, refresh is opt-in

Access tokens are valid for 60 days. After that, the API returns 401 with a `REVOKED_ACCESS_TOKEN` error. You can opt into refresh tokens by adding `offline_access` to your scopes, but only if your app has been approved for it. Most apps are not. Plan to re-prompt users for consent every 60 days, or apply for the refresh flow if your use case justifies it.

## 6. Scope creep does not apply retroactively

If you grant a user `openid profile email` today and add `w_member_social` next week, the user's existing access token does NOT include the new scope. You need to re-run them through OAuth with the new scopes. The token they get back includes the union of new and previously granted scopes.

The annoying part: there is no clean way to detect "this user needs to re-auth" from the API. You only find out when you try to call an endpoint that requires the new scope and it returns 403. Track the scopes you requested per user in your own database and compare against your current code.

## 7. The consent screen caches aggressively

If you change scopes during development and try to test, LinkedIn shows the user the cached consent from last time. The token comes back with the OLD scopes. You will spend time wondering why your code is not picking up the new scope you added.

Two fixes:

```
// Option A: force consent every time during dev
authorization: { params: { scope: "...", prompt: "consent" } }

// Option B: have the user revoke the connection in their LinkedIn settings
```

Use option A while developing. Drop it for production because forcing consent every login annoys users.

That is the list. None of these are exotic. All of them have bitten me more than once. Bookmark this if you are building anything that touches LinkedIn programmatically.
