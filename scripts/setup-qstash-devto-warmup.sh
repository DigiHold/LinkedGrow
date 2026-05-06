#!/bin/bash
# Daily cron that publishes one dev.to warmup article per day until all 7 are
# live. Runs daily at 15:00 UTC (8 AM LA / 17h Paris). Stops naturally once
# all articles in src/content/devto-warmup/ are published. Delete after May 13.
#
# Usage: QSTASH_TOKEN=your_token bash scripts/setup-qstash-devto-warmup.sh

if [ -z "$QSTASH_TOKEN" ]; then
  echo "Error: QSTASH_TOKEN required"
  exit 1
fi

QSTASH_URL="${QSTASH_URL:-https://qstash-us-east-1.upstash.io}"
DESTINATION="https://linkedgrow.ai/api/cron/devto-warmup"
CRON_SCHEDULE="0 15 * * *"

echo "Creating QStash daily warmup schedule..."
echo "  Destination: $DESTINATION"
echo "  Schedule: $CRON_SCHEDULE (daily at 15:00 UTC / 8 AM LA)"

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "$QSTASH_URL/v2/schedules/$DESTINATION" \
  -H "Authorization: Bearer $QSTASH_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Upstash-Cron: $CRON_SCHEDULE" \
  -H "Upstash-Retries: 2" \
  -d '{}')

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
  echo "Schedule created successfully:"
  echo "$BODY"
else
  echo "Error (HTTP $HTTP_CODE):"
  echo "$BODY"
  exit 1
fi
