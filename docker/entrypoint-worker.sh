#!/bin/sh
set -eu
if [ -z "${CHROME_PATH:-}" ] && [ "$(uname -m)" != "x86_64" ]; then
  export CHROME_PATH=/usr/bin/chromium
fi

# The same 2 secrets the app generated on its first start, read from the config
# volume both containers mount. ENCRYPTION_KEY has to be the identical value or
# nothing the app stored decrypts here. Compose starts this container only once
# the app answers its health check, so the file is always written by then. A
# value already in the environment wins, the same rule the app follows.
SECRETS_FILE="${CONFIG_DIR:-/data/config}/secrets.env"
if [ -f "$SECRETS_FILE" ]; then
  for name in AUTH_SECRET ENCRYPTION_KEY; do
    eval "current=\${$name:-}"
    if [ -z "$current" ]; then
      value=$(sed -n "s/^$name=//p" "$SECRETS_FILE" | head -n 1)
      [ -z "$value" ] || eval "export $name=\$value"
    fi
  done
fi

for d in "${PROFILE_ROOT:-/data/profiles}" "${STORAGE_ROOT:-/data/uploads}"; do
  [ -w "$d" ] || { echo "worker: $d is not writable by uid $(id -u). Fix the volume once: docker compose run --rm --user root --entrypoint chown worker -R 10001:10001 $d" >&2; exit 1; }
done
Xvfb :99 -screen 0 "${SCREEN_SIZE:-1920x1080}x24" -nolisten tcp -dpi 96 >/dev/null 2>&1 &
sleep 1
until curl -sf "${APP_INTERNAL_URL:-http://app:3000}/api/health" >/dev/null; do
  echo "worker: waiting for the app"; sleep 3
done
exec node --experimental-strip-types src/worker.ts
