# Changelog

## Unreleased

Installing takes one command on a fresh server. `install.sh` installs Docker when it is missing, generates the secrets, writes `.env`, pulls the images and starts the stack, and it asks a single question, the domain. The compose file now pulls `ghcr.io/digihold/linkedgrow` and `ghcr.io/digihold/linkedgrow-worker` instead of building them, `docker-compose.build.yml` builds them from a checkout, and a Caddy service serves https when you give the installer a domain. `llms-install.md` writes the same run down for an AI agent with shell access to the server.

## 1.0.0 (unreleased)

First self hosted release: a Docker Compose stack (app, worker, database), a first login setup wizard (AI provider, dedicated addresses through Proxy-Seller or your own proxy, email through Resend or SMTP, local or S3 storage), every feature unlocked, and agents and posting on any of 5 AI providers.
