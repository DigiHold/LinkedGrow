import { EDITION, assertEditionConsistency } from "@/lib/edition";

/**
 * Fail closed at boot: a rejected instrumentation hook leaves Next serving
 * 500s for ever, so the process ends itself instead. The compiled edition is
 * what the bundles answer, so it is the one compared against the runtime
 * secrets. Kept out of instrumentation.ts because Turbopack also compiles that
 * file for the Edge runtime and warns about every process.* call it finds there.
 */
export function assertEditionAtBoot(): void {
  try {
    assertEditionConsistency({ ...process.env, LINKEDGROW_EDITION: EDITION });
  } catch (error) {
    process.stderr.write(`linkedgrow: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}
