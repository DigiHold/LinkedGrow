/**
 * Kills Chrome processes that outlived their session.
 *
 * On 2026-08-14 the VPS had accumulated 640 Chrome processes left behind by
 * sessions whose close failed quietly. Together they exhausted the X server's
 * client table and the kernel's inotify instances, so every new launch died at
 * startup, every pass failed, and the stopped-agent emails went out about
 * accounts that were fine. No visit comes anywhere near MAX_AGE_SECONDS, so a
 * Chrome older than that under our profile root is a leak by definition.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolve } from "node:path";
import { PROFILE_ROOT } from "../browser/driver.ts";
import { log } from "../logger.ts";

const run = promisify(execFile);

export const MAX_AGE_SECONDS = 3 * 60 * 60;

/** Pure part: which pids in `ps -eo pid=,etimes=,args=` output are leaks. */
export function leakedPids(
  psOutput: string,
  profileRoot: string,
  maxAgeSeconds: number
): number[] {
  const marker = `--user-data-dir=${profileRoot}`;
  const pids: number[] = [];
  for (const line of psOutput.split("\n")) {
    const m = line.match(/^\s*(\d+)\s+(\d+)\s+(.*)$/);
    if (!m) continue;
    const pid = Number(m[1]);
    const ageSeconds = Number(m[2]);
    const args = m[3] ?? "";
    if (!args.includes(marker)) continue;
    if (ageSeconds <= maxAgeSeconds) continue;
    pids.push(pid);
  }
  return pids;
}

/** Sweeps once. Returns how many processes were killed. */
export async function reapLeakedChromes(): Promise<number> {
  // ps flags and the leak itself are Linux-shaped; there is nothing to reap
  // on a development machine.
  if (process.platform !== "linux") return 0;
  try {
    const { stdout } = await run("ps", ["-eo", "pid=,etimes=,args="], {
      maxBuffer: 16 * 1024 * 1024,
    });
    const pids = leakedPids(stdout, resolve(PROFILE_ROOT), MAX_AGE_SECONDS);
    let killed = 0;
    for (const pid of pids) {
      try {
        process.kill(pid, "SIGKILL");
        killed += 1;
      } catch {
        // Already gone, or not ours to kill. Either way the sweep moves on.
      }
    }
    if (killed > 0) log("reaped leaked chrome processes", { count: killed });
    return killed;
  } catch {
    return 0;
  }
}
