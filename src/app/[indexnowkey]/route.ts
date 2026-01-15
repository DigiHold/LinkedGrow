import { NextRequest, NextResponse } from "next/server";
import { notFound } from "next/navigation";

// IndexNow key verification endpoint
// This serves the key file at /{key}.txt for verification

const INDEXNOW_KEY = process.env.INDEXNOW_KEY || "";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ indexnowkey: string }> }
) {
  const params = await context.params;
  const { indexnowkey } = params;

  // Only respond for .txt files that match the IndexNow key pattern
  // This prevents catching other routes like /footer-preview
  if (!indexnowkey.endsWith(".txt")) {
    notFound();
  }

  // Only respond for the correct key file
  if (!INDEXNOW_KEY || indexnowkey !== `${INDEXNOW_KEY}.txt`) {
    notFound();
  }

  // Return the key as plain text
  return new NextResponse(INDEXNOW_KEY, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
