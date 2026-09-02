# Security

## Reporting a vulnerability

Email contact@linkedgrow.ai with the details and steps to reproduce. Please do not open a public issue for a vulnerability. You will get an answer within 3 working days.

## What is encrypted

LinkedIn passwords and 2FA secrets, every API key (AI providers, proxy supplier, email, storage) and proxy credentials are encrypted at rest with AES-256-GCM using the `ENCRYPTION_KEY` from your `.env`. The worker needs the same key to read them, and sessions are signed with the `AUTH_SECRET` from the same file.

## What a self hosted install exposes

Port 3000 of the app container. The database and the worker have no published ports. Put a reverse proxy with https in front of the app, and keep the 3 volumes out of reach of other users on the host.
