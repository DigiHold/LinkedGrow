// Retry wrapper for AI provider HTTP calls.
//
// AI providers return transient errors when their servers are busy - most
// notably Anthropic, which responds with HTTP 529 and the message "Overloaded".
// Those are not real failures: retrying a few seconds later almost always
// succeeds. This wrapper retries retryable statuses with exponential backoff so
// the user never sees a raw "Overloaded" error.

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 529]);

export async function fetchAIWithRetry(
  url: string,
  init: RequestInit,
  retries = 3
): Promise<Response> {
  let lastStatus = 0;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      // Exponential backoff: 1s, 2s, 4s
      await new Promise((r) => setTimeout(r, 1000 * 2 ** (attempt - 1)));
    }

    let res: Response;
    try {
      res = await fetch(url, init);
    } catch (err) {
      // Network-level error - retry, or rethrow on the final attempt
      if (attempt === retries) throw err;
      continue;
    }

    // Success or a non-retryable error (bad key, bad request): hand it straight
    // back so the caller's existing error handling reports the real cause.
    if (!RETRYABLE_STATUS.has(res.status)) return res;

    lastStatus = res.status;
    // Free the connection before the next attempt
    res.body?.cancel().catch(() => {});
  }

  throw new Error(
    lastStatus === 429
      ? "Your AI provider is rate-limiting requests right now. Wait a minute and try again."
      : "Your AI provider is temporarily overloaded. Wait a moment and try again."
  );
}
