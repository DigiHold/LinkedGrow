#!/bin/bash
# One-time setup: Create a QStash daily schedule to auto-index all sitemap URLs.
# Run this once. The schedule persists in QStash until you delete it.
#
# Usage: QSTASH_TOKEN=your_token bash scripts/setup-qstash-indexing-cron.sh
#
# QStash region: us-east-1 (QSTASH_URL can override)
# To list existing schedules: curl -H "Authorization: Bearer $QSTASH_TOKEN" $QSTASH_URL/v2/schedules
# To delete a schedule:       curl -X DELETE -H "Authorization: Bearer $QSTASH_TOKEN" $QSTASH_URL/v2/schedules/SCHEDULE_ID

if [ -z "$QSTASH_TOKEN" ]; then
  echo "Error: QSTASH_TOKEN environment variable is required"
  echo "Usage: QSTASH_TOKEN=your_token bash scripts/setup-qstash-indexing-cron.sh"
  exit 1
fi

QSTASH_URL="${QSTASH_URL:-https://qstash-us-east-1.upstash.io}"

DESTINATION="https://linkedgrow.ai/api/cron/index-sitemap"
# Daily at 8:00 AM UTC (midnight LA / 9 AM Paris)
CRON_SCHEDULE="0 8 * * *"

echo "Creating QStash daily schedule..."
echo "  Destination: $DESTINATION"
echo "  Schedule: $CRON_SCHEDULE (daily at 8 AM UTC)"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "$QSTASH_URL/v2/schedules/$DESTINATION" \
  -H "Authorization: Bearer $QSTASH_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Upstash-Cron: $CRON_SCHEDULE" \
  -d '{}')

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
  echo "Schedule created successfully!"
  echo "$BODY"
else
  echo "Error creating schedule (HTTP $HTTP_CODE):"
  echo "$BODY"
  exit 1
fi
