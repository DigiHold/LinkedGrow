---
title: "API Access"
description: "Integrate LinkedGrow into your workflow with REST API access for managing posts programmatically."
category: "integrations"
order: 2
---

## Overview

LinkedGrow provides a REST API that lets you manage your posts programmatically. You can create, read, update, and delete posts through API calls, making it easy to integrate LinkedGrow into your existing tools and workflows.

Every user of the instance can create a key and call the API with it.

## What You Can Do with the API

The LinkedGrow API enables you to:

- Create new posts from external tools or scripts
- Retrieve your existing posts and drafts
- Update post content before publishing
- Delete posts you no longer need
- Integrate with automation platforms like Zapier, Make, or n8n
- Build custom dashboards or content pipelines

## Creating an API Key

To use the API, you need an API key:

1. Go to **Settings** in the left sidebar
2. Click on the **API** section
3. Click **Create API Key**
4. Enter a descriptive **Key Name** (for example, "Zapier integration" or "Content pipeline")
5. Select the **scopes** you want to grant this key (see below)
6. Click **Create**
7. Copy the API key immediately - it will not be shown again

**Important:** Treat your API key like a password. Do not share it publicly, commit it to version control, or include it in client-side code. If a key is compromised, revoke it immediately and create a new one.

You can create multiple API keys for different integrations. Each key can be revoked independently without affecting others.

## Scoped Permissions

When creating an API key, you select which scopes (permissions) the key should have. This lets you follow the principle of least privilege by only granting the access each integration needs.

Available scopes:

- **posts:read** - Read and list posts
- **posts:write** - Create and update posts
- **posts:delete** - Delete posts
- **ideas:read** - Read and list ideas
- **ideas:write** - Create and update ideas
- **analytics:read** - Read analytics data
- **profile:read** - Read profile information

For example, if you are building a read-only dashboard, you only need `posts:read` and `analytics:read`. If you are building a content pipeline that creates posts, you would also need `posts:write`.

## Authentication

All API requests must include your API key in the Authorization header using the Bearer scheme:

```
Authorization: Bearer your-api-key-here
```

Requests without a valid API key will receive a 401 Unauthorized response. Requests that attempt actions outside the key's scopes will receive a 403 Forbidden response.

## Available Endpoints

### Posts

The posts endpoint lets you manage your LinkedIn posts:

**Base URL:** the address of your instance followed by `/api/v1/posts`

#### List All Posts

```
GET /api/v1/posts
```

Returns a list of all your posts, which you can filter by status (draft, scheduled, published).

Required scope: `posts:read`

Query parameters:

- `status` - filter by post status (draft, scheduled, published)
- `limit` - number of posts to return (default: 20, max: 100)
- `offset` - pagination offset

Every successful call comes back inside the same envelope, with the payload under `data` and a `success` flag beside it:

```json
{
  "data": {
    "posts": [
      {
        "id": "post_abc123",
        "content": "Your post content here...",
        "status": "draft",
        "media": [],
        "createdAt": "2025-01-15T10:30:00Z",
        "updatedAt": "2025-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 42,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  },
  "success": true
}
```

#### Get a Single Post

```
GET /api/v1/posts/:id
```

Returns the full details of a specific post.

Required scope: `posts:read`

#### Create a Post

```
POST /api/v1/posts
```

Creates a new post from the content you send in the request body:

```json
{
  "content": "Your LinkedIn post content here...",
  "status": "draft"
}
```

The `status` field accepts "draft" or "scheduled". If you set it to "scheduled", you must also include a `scheduledAt` field with an ISO 8601 datetime.

Required scope: `posts:write`

#### Update a Post

```
PUT /api/v1/posts/:id
```

Updates an existing post, and you send only the fields you want to change:

```json
{
  "content": "Updated post content..."
}
```

Required scope: `posts:write`

#### Delete a Post

```
DELETE /api/v1/posts/:id
```

Permanently deletes a post, and nothing about that can be undone afterwards.

Required scope: `posts:delete`

## Rate Limits

Each API key is allowed 60 requests a minute, counted against the key rather than the address it comes from. That is the only quota the code enforces, and there is no hourly or daily one behind it.

Go past the minute and the next call answers 429, with the number of seconds left written into the error message. Nothing sends a `Retry-After` header, so read the message rather than waiting on a header that does not arrive.

## Error Handling

The API uses standard HTTP status codes:

- **200** - Success
- **201** - Created (for new posts)
- **400** - Bad request (invalid parameters)
- **401** - Unauthorized (missing or invalid API key)
- **403** - Forbidden (insufficient scopes)
- **404** - Not found
- **429** - Too many requests (rate limit exceeded)
- **500** - Internal server error

Every error carries the message as a plain string, next to the same `success` flag the successful calls use. There is no error code and no nested object to read:

```json
{
  "error": "Content is required",
  "success": false
}
```

## Managing API Keys

From **Settings** > **API**, you can:

- View all your active API keys and when they were last used
- Create new API keys with descriptive names and scoped permissions
- Revoke API keys that are no longer needed

Revoking an API key takes effect immediately, and any integration using that key stops working right away.

## Security Best Practices

- Store API keys in environment variables, not in your code
- Use different API keys for different integrations
- Grant only the scopes each integration needs
- Revoke API keys you are no longer using
- Monitor key usage in your API settings
- Never expose API keys in browser-side JavaScript or public repositories

## Questions?

For a bug or a feature request, open an issue on the [LinkedGrow GitHub repository](https://github.com/DigiHold/LinkedGrow/issues).
