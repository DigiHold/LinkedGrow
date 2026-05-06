#!/bin/bash
# One-time setup: Create a QStash daily schedule that cross-posts new blog
# articles (published 1+ days ago, not yet cross-posted) to dev.to + Hashnode.
#
# Usage: QSTASH_TOKEN=your_token bash scripts/setup-qstash-cross-post-cron.sh
#
# To list existing schedules: curl -H "Authorization: Bearer $QSTASH_TOKEN" $QSTASH_URL/v2/schedules
# To delete a schedule:       curl -X DELETE -H "Authorization: Bearer $QSTASH_TOKEN" $QSTASH_URL/v2/schedules/SCHEDULE_ID

if [ -z "$QSTASH_TOKEN" ]; then
  echo "Error: QSTASH_TOKEN environment variable is required"
  echo "Usage: QSTASH_TOKEN=your_token bash scripts/setup-qstash-cross-post-cron.sh"
  exit 1
fi

QSTASH_URL="${QSTASH_URL:-https://qstash-us-east-1.upstash.io}"

DESTINATION="https://linkedgrow.ai/api/cron/cross-post"
# Daily at 14:00 UTC (7 AM Los Angeles / 10 AM New York / 16:00 Paris)
CRON_SCHEDULE="0 14 * * *"

echo "Creating QStash daily schedule..."
echo "  Destination: $DESTINATION"
echo "  Schedule: $CRON_SCHEDULE (daily at 14:00 UTC / 7 AM LA)"
echo ""

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
  echo "Schedule created successfully!"
  echo "$BODY"
else
  echo "Error creating schedule (HTTP $HTTP_CODE):"
  echo "$BODY"
  exit 1
fi
