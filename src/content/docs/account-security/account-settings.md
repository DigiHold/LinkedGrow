---
title: "Account Settings"
description: Manage your LinkedGrow account settings, including profile information, login methods, and LinkedIn connection.
category: "account-security"
order: 3
---

## Accessing Account Settings

To access your account settings:

1. Go to **Settings** in the left sidebar

The Settings page is one continuous page with multiple card sections. There are no separate tabs - you scroll through the sections to find what you need.

## Profile Information

The profile section at the top of the Settings page displays your account details:

- **Name** - you can update your display name at any time
- **Email** - your email address is displayed but cannot be changed. The email field is disabled with a note that reads "Email cannot be changed".

## Login Methods

LinkedGrow supports 2 login methods, and you can use one or both of them to reach your account:

### Email and Password

The standard login method, where you sign in with your email address and a password you set during registration or through the forgot password flow. See [Password Management](/docs/account-security/password-management) for details on managing your password.

### Google sign in

Sign in with your Google account when the administrator has configured it (`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in the instance's `.env`). Google sign in only reads your name and email address, and the instance never touches your Google Drive, contacts or other data.

### Using Multiple Login Methods

You can have both login methods active at the same time, which gives you a backup if one of them becomes unavailable. For example, if you forget your password, you can still sign in with Google.

You must always have at least one active login method. If you try to disconnect a login method and it is the only one connected, you will be prompted to set up an alternative first.

## LinkedIn Connection

Your LinkedIn account connection has its own card section on the Settings page. This is the connection used for publishing posts to LinkedIn and is separate from how you log in to LinkedGrow.

From this card, you can:

- View your currently connected LinkedIn account
- Connect a new LinkedIn account
- Disconnect your LinkedIn account

## Data Privacy

LinkedGrow takes your data privacy seriously. Here is how we handle your information:

### What We Store

- Your account profile (name, email, profile picture)
- Your posts, drafts, and scheduled content
- Your scheduling preferences and settings
- Analytics data for your published posts
- Voice training data (if you use the voice training feature)
- **Your LinkedIn sign-in details, encrypted.** LinkedGrow signs a real browser
  session in on your behalf rather than going through LinkedIn's API, so it
  needs the email and password you gave it. They are encrypted before they are
  written down, they are never shown back to you or to anyone else, and they are
  used for nothing except keeping your own session signed in.

### What We Do Not Store

- Your AI API keys are encrypted and never stored in plain text

### Data Access

- Only you can see your posts and drafts
- Team members you invited from the Team page can see shared team content
- Everything lives on your own server, and nobody at LinkedGrow can reach it

## Questions

For anything this page does not answer, read the rest of the docs at `/docs` or open an issue on the [LinkedGrow GitHub repository](https://github.com/DigiHold/LinkedGrow/issues).
