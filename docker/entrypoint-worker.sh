#!/bin/sh
set -eu
if [ -z "${CHROME_PATH:-}" ] && [ "$(uname -m)" != "x86_64" ]; then
  export CHROME_PATH=/usr/bin/chromium
fi
Xvfb :99 -screen 0 "${SCREEN_SIZE:-1920x1080}x24" -nolisten tcp -dpi 96 >/dev/null 2>&1 &
sleep 1
until curl -sf "${APP_INTERNAL_URL:-http://app:3000}/api/health" >/dev/null; do
  echo "worker: waiting for the app"; sleep 3
done
exec node --experimental-strip-types src/worker.ts
