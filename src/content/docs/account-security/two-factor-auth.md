---
title: "Two-Factor Authentication"
description: "Set up two-factor authentication (2FA) to add an extra layer of security to your LinkedGrow account."
category: "account-security"
order: 1
---

## What is Two-Factor Authentication?

Two-factor authentication (2FA) adds a second layer of security to your LinkedGrow account. When enabled, you need both your password and a verification code from an authenticator app to sign in. This means that even if someone discovers your password, they cannot access your account without also having your authenticator device.

We strongly recommend enabling 2FA for all LinkedGrow accounts, especially if you manage business content or collaborate with a team.

## Supported Authenticator Apps

LinkedGrow supports any TOTP-compatible authenticator app. Popular options include:

- **Google Authenticator** - available for iOS and Android
- **Authy** - available for iOS, Android, and desktop
- **1Password** - built-in authenticator in the password manager
- **Microsoft Authenticator** - available for iOS and Android
- **Bitwarden** - built-in authenticator in the password manager

If you already use one of these apps for other services, you can add LinkedGrow as a new entry in the same app.

## How to Enable 2FA

Follow these steps to enable two-factor authentication on your account:

1. Go to **Settings** in the left sidebar
2. Click on the **Account** tab
3. Find the **Two-Factor Authentication** section
4. Click **Enable 2FA**
5. A QR code will appear on your screen
6. Open your authenticator app and scan the QR code
7. Your authenticator app will generate a 6-digit verification code
8. Enter the verification code in the confirmation field on LinkedGrow
9. Click **Verify and Enable**

Once verified, 2FA is active on your account. You will be prompted for a verification code each time you sign in.

## Save Your Backup Codes

After enabling 2FA, LinkedGrow generates a set of backup codes. These are one-time-use codes that allow you to sign in if you lose access to your authenticator app.

**Important:** Save your backup codes in a secure location immediately. You will not be able to view them again after closing the dialog.

Recommended ways to store backup codes:

- In a password manager (such as 1Password, Bitwarden, or LastPass)
- Printed on paper and stored in a safe place
- In an encrypted note on your device

Each backup code can only be used once. After using a backup code, it is no longer valid.

## Signing In with 2FA

After enabling 2FA, your sign-in process works like this:

1. Enter your email and password as usual
2. A second screen will ask for your verification code
3. Open your authenticator app and find the LinkedGrow entry
4. Enter the 6-digit code displayed in the app
5. Click **Verify** to complete sign-in

The code changes every 30 seconds, so make sure to enter the current code. If the code expires while you are typing, wait for the next one and try again.

## How to Disable 2FA

If you need to disable two-factor authentication:

1. Go to **Settings** > **Account**
2. Find the **Two-Factor Authentication** section
3. Click **Disable 2FA**
4. Enter your current password to confirm
5. Enter a verification code from your authenticator app
6. Click **Confirm** to disable 2FA

After disabling 2FA, you will only need your password to sign in. We recommend keeping 2FA enabled for better security.

## Lost Access to Your Authenticator

If you lose your phone or cannot access your authenticator app, you can still sign in using a backup code:

1. On the 2FA verification screen, click **Use a backup code**
2. Enter one of your saved backup codes
3. Click **Verify** to sign in

Once signed in, we recommend immediately setting up 2FA again with your new device or app. Go to **Settings** > **Account** to disable the old 2FA and enable it again with a new QR code.

If you have lost both your authenticator and your backup codes, contact us at [contact@linkedgrow.ai](mailto:contact@linkedgrow.ai) from the email address associated with your account. We will verify your identity and help you regain access. This process may take 1 to 2 business days for security reasons.

## Best Practices

- **Enable 2FA as soon as you create your account** - it takes less than a minute
- **Store backup codes securely** - treat them like passwords
- **Use a reputable authenticator app** - avoid SMS-based 2FA when possible
- **Keep your authenticator app updated** - older versions may have security issues
- **If you get a new phone**, set up your authenticator on the new device before wiping the old one
