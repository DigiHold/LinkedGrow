#!/bin/sh
set -eu
fail() { echo "linkedgrow: $1" >&2; exit 1; }

# The 2 secrets this instance signs and encrypts with. Nobody has to supply
# them: the first start writes both into a file on the config volume, readable
# by this user alone, and every later start reads them back. A value already in
# the environment always wins, which is how somebody restoring a backup puts
# the original ENCRYPTION_KEY back. Losing the file makes every stored LinkedIn
# password, 2FA secret and API key permanently unreadable, so it belongs in the
# backup set with the database.
CONFIG_DIR="${CONFIG_DIR:-/data/config}"
SECRETS_FILE="$CONFIG_DIR/secrets.env"

random_hex() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 32
  else
    node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))"
  fi
}

read_secret() { [ -f "$SECRETS_FILE" ] && sed -n "s/^$1=//p" "$SECRETS_FILE" | head -n 1 || true; }

[ -d "$CONFIG_DIR" ] || mkdir -p "$CONFIG_DIR" 2>/dev/null || true
[ -w "$CONFIG_DIR" ] || fail "$CONFIG_DIR is not writable by uid $(id -u). Fix the volume once: docker compose run --rm --user root --entrypoint chown app -R 10001:10001 $CONFIG_DIR"

# "change-me" was the placeholder of the old .env.example, so it counts as unset.
[ "${AUTH_SECRET:-change-me}" != "change-me" ] || AUTH_SECRET=""
# A key that is set and wrong is never quietly replaced: a generated one would
# make every credential already in the database unreadable.
if [ -n "${ENCRYPTION_KEY:-}" ]; then
  echo "$ENCRYPTION_KEY" | grep -Eq '^[0-9a-fA-F]{64}$' \
    || fail "ENCRYPTION_KEY is set but is not 64 hex characters. Put the original back, or unset it and let this instance generate one."
fi

[ -n "${AUTH_SECRET:-}" ] || AUTH_SECRET=$(read_secret AUTH_SECRET)
[ -n "${ENCRYPTION_KEY:-}" ] || ENCRYPTION_KEY=$(read_secret ENCRYPTION_KEY)

if [ -z "${AUTH_SECRET:-}" ] || [ -z "${ENCRYPTION_KEY:-}" ]; then
  [ -n "${AUTH_SECRET:-}" ] || AUTH_SECRET=$(random_hex)
  [ -n "${ENCRYPTION_KEY:-}" ] || ENCRYPTION_KEY=$(random_hex)
  (
    umask 077
    printf 'AUTH_SECRET=%s\nENCRYPTION_KEY=%s\n' "$AUTH_SECRET" "$ENCRYPTION_KEY" > "$SECRETS_FILE"
  )
  chmod 600 "$SECRETS_FILE"
  echo "linkedgrow: wrote the instance secrets to $SECRETS_FILE inside the config volume."
  echo "linkedgrow: back that volume up with the database. Without ENCRYPTION_KEY every stored credential is unreadable."
fi
export AUTH_SECRET ENCRYPTION_KEY

[ -w "${STORAGE_ROOT:-/data/uploads}" ] || fail "${STORAGE_ROOT:-/data/uploads} is not writable by uid $(id -u). Fix the volume once: docker compose run --rm --user root --entrypoint chown app -R 10001:10001 ${STORAGE_ROOT:-/data/uploads}"

# The address is not configuration. With no APP_URL the app answers on whatever
# address the request arrived on, and the setup wizard stores the one links in
# emails use. An APP_URL that is set still wins, everywhere.
export AUTH_TRUST_HOST=true
if [ -n "${APP_URL:-}" ]; then
  export NEXT_PUBLIC_APP_URL="$APP_URL" AUTH_URL="$APP_URL"
fi

echo "linkedgrow: applying migrations"
node docker/migrate.mjs docker/migrations
echo "linkedgrow: starting on ${APP_URL:-port 3000, at whatever address you open}"
exec node server.js
