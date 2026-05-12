#!/bin/bash
# Create QStash daily schedules for the 2 new trial-lifecycle crons:
#   - /api/cron/expire-trials       (flip Day 7 trials to free + hasUsedTrial)
#   - /api/cron/inactive-accounts   (Day 55 warning + Day 60 delete)
#
# Both run at 09:00 UTC (same time as the existing sync-free-users cron) so
# the 3 daily trial jobs all fire in one window. Use Upstash dashboard to
# verify they appear after running.
#
# Usage: QSTASH_TOKEN=your_token bash scripts/setup-qstash-trial-crons.sh

if [ -z "$QSTASH_TOKEN" ]; then
  echo "Error: QSTASH_TOKEN required"
  exit 1
fi

QSTASH_URL="${QSTASH_URL:-https://qstash-us-east-1.upstash.io}"
CRON_SCHEDULE="0 9 * * *"

create_schedule() {
  local route="$1"
  local destination="https://linkedgrow.ai${route}"

  echo "Creating schedule for $route ..."
  RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "$QSTASH_URL/v2/schedules/$destination" \
    -H "Authorization: Bearer $QSTASH_TOKEN" \
    -H "Content-Type: application/json" \
    -H "Upstash-Cron: $CRON_SCHEDULE" \
    -H "Upstash-Retries: 2" \
    -d '{}')

  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
    echo "  OK: $BODY"
  else
    echo "  FAIL (HTTP $HTTP_CODE): $BODY"
    exit 1
  fi
}

create_schedule "/api/cron/expire-trials"
create_schedule "/api/cron/inactive-accounts"

echo ""
echo "Both schedules created. Verify in Upstash console: https://console.upstash.com/qstash"
