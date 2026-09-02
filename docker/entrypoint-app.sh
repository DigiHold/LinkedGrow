#!/bin/sh
set -eu
fail() { echo "linkedgrow: $1" >&2; exit 1; }
[ "${AUTH_SECRET:-change-me}" != "change-me" ] || fail "AUTH_SECRET is not set. Put the output of 'openssl rand -hex 32' in .env"
echo "${ENCRYPTION_KEY:-}" | grep -Eq '^[0-9a-fA-F]{64}$' || fail "ENCRYPTION_KEY must be exactly 64 hex characters. Put the output of 'openssl rand -hex 32' in .env"
[ -n "${APP_URL:-}" ] || fail "APP_URL is not set"
export NEXT_PUBLIC_APP_URL="$APP_URL" AUTH_URL="$APP_URL" AUTH_TRUST_HOST=true
echo "linkedgrow: applying migrations"
node docker/migrate.mjs docker/migrations
echo "linkedgrow: starting on $APP_URL"
exec node server.js
