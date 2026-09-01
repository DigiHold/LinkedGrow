import { test } from "node:test";
import assert from "node:assert/strict";
import { leakedPids, MAX_AGE_SECONDS } from "./reaper.ts";

const ROOT = "/opt/linkedgrow/profiles";

function line(pid: number, age: number, args: string): string {
  return `  ${pid} ${age} ${args}`;
}

test("a chrome under the profile root and older than the cap is a leak", () => {
  const ps = line(
    413090,
    MAX_AGE_SECONDS + 60,
    `/opt/google/chrome/chrome --user-data-dir=${ROOT}/88c3d39f --remote-debugging-pipe`
  );
  assert.deepEqual(leakedPids(ps, ROOT, MAX_AGE_SECONDS), [413090]);
});

test("a young chrome is an active session and is never touched", () => {
  const ps = line(500, 120, `/opt/google/chrome/chrome --user-data-dir=${ROOT}/88c3d39f`);
  assert.deepEqual(leakedPids(ps, ROOT, MAX_AGE_SECONDS), []);
});

test("an old process outside the profile root is somebody else's", () => {
  const ps = [
    line(1, 999999, "/sbin/init"),
    line(700, 999999, "/usr/bin/Xvfb :99 -screen 0 2560x1440x24"),
    line(701, 999999, "/opt/google/chrome/chrome --user-data-dir=/home/other/profile"),
  ].join("\n");
  assert.deepEqual(leakedPids(ps, ROOT, MAX_AGE_SECONDS), []);
});

test("the 640-process pileup shape: every stale renderer goes, the fresh one stays", () => {
  const stale = Array.from({ length: 5 }, (_, i) =>
    line(1000 + i, MAX_AGE_SECONDS + 1000 + i, `chrome --type=renderer --user-data-dir=${ROOT}/acc`)
  );
  const fresh = line(2000, 30, `chrome --user-data-dir=${ROOT}/acc`);
  const got = leakedPids([...stale, fresh].join("\n"), ROOT, MAX_AGE_SECONDS);
  assert.deepEqual(got, [1000, 1001, 1002, 1003, 1004]);
});

test("garbage lines never throw", () => {
  const ps = "\nnot a process line\n   \n12 abc chrome\n";
  assert.deepEqual(leakedPids(ps, ROOT, MAX_AGE_SECONDS), []);
});
