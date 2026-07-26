/**
 * One output channel for the worker.
 *
 * Structured, because this runs unattended on a box nobody is watching and the
 * lines are read after the fact. Never logs a credential, an address or a
 * message body: plan section 4b, secrets do not appear in logs.
 */
export function log(message: string, fields: Record<string, unknown> = {}): void {
  const line = JSON.stringify({
    at: new Date().toISOString(),
    message,
    ...fields,
  });
  process.stdout.write(line + "\n");
}

export function logError(message: string, error: unknown, fields: Record<string, unknown> = {}): void {
  log(message, {
    ...fields,
    error: error instanceof Error ? error.message : String(error),
  });
}
