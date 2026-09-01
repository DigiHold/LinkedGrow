import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

/**
 * Two rules that are easy to write code against and easy to forget.
 *
 * **Everything an account does goes through its own address.** Publishing and
 * reading analytics were added after the agent loop and each opens its own
 * session, so each had to remember to ask for the allocation and to refuse in
 * production without one. Forgetting is invisible in development, where there
 * is no allocation anyway, and in production it means an account acting from a
 * datacentre.
 *
 * **Everything an account types goes through the persona's keyboard.** There is
 * a good typing model in human.ts, with this account's own speed, pauses that
 * cluster at words and sentences, and typos backspaced out. Playwright's
 * pressSequentially takes a delay and looks close enough, which is how the
 * post composer and the message composer ended up typing at two different
 * rhythms for the same person.
 */

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

const SESSION_OPENERS = ["../publish/pass.ts", "../insights/pass.ts", "../worker.ts"];

for (const file of SESSION_OPENERS) {
  test(`${file} opens its session on the account's own address`, () => {
    const src = read(file);
    assert.match(src, /allocationFor\(/, "the address is never looked up");
    assert.match(
      src,
      /isProduction\(\)/,
      "nothing stops this running from the server's own address in production"
    );
    // The allocation has to reach openSession, not just be fetched and dropped.
    const opens = /openSession\(/.test(src);
    if (opens) {
      assert.match(
        src,
        /openSession\([\s\S]{0,400}?(address|proxy)\s*\)/,
        "openSession is called without the allocation"
      );
    }
  });
}

test("nothing types into LinkedIn with a flat delay instead of the persona's keyboard", () => {
  const dirs = ["../linkedin", "../publish", "../insights"];
  const offenders: string[] = [];

  for (const dir of dirs) {
    const base = new URL(`${dir}/`, import.meta.url);
    for (const name of readdirSync(base)) {
      if (!name.endsWith(".ts") || name.endsWith(".test.ts")) continue;
      const src = readFileSync(new URL(name, base), "utf8");
      src.split("\n").forEach((line, i) => {
        if (!line.includes("pressSequentially")) return;
        // The one exception, and it is deliberate: LinkedIn's schedule picker
        // is a short validated field that reformats what it is given, and a
        // typo backspaced out of it can leave it in a state that silently
        // rejects the date. Dates are typed evenly by people anyway.
        if (src.includes("setField") && line.includes("field.pressSequentially")) return;
        offenders.push(`${dir}/${name}:${i + 1}`);
      });
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `these type at a flat rate instead of through typeHumanHere: ${offenders.join(", ")}`
  );
});

test("publishing reads the feed before it opens the composer", () => {
  const src = read("../linkedin/publish.ts");
  const settle = src.indexOf("async function settleOnFeed");
  const compose = src.indexOf("await settleOnFeed(page)");
  assert.ok(settle > 0, "there is no arrival on the feed at all");
  assert.ok(compose > 0, "the composer opens without the feed having been looked at");
  assert.match(src.slice(settle, settle + 600), /scrollHuman/, "the feed is loaded and not read");
});

/**
 * The safety property of native scheduling, asserted on the code because the
 * failure only shows up hours later on somebody's profile.
 *
 * If LinkedIn's Schedule control cannot be driven, the post is NOT published.
 * It is not due for hours. The alternative reading of "scheduling failed" is
 * "post it now", and now is a day early.
 */
test("a scheduler that cannot be driven never turns into an immediate post", () => {
  const publish = read("../linkedin/publish.ts");
  assert.match(
    publish,
    /class ScheduleUnavailableError/,
    "there is no separate error for the scheduler being unavailable"
  );
  // useScheduler must throw rather than fall through to the Post button.
  const scheduler = publish.slice(publish.indexOf("async function useScheduler"));
  const body = scheduler.slice(0, scheduler.indexOf("\n}\n"));
  assert.ok(
    !/postButton/.test(body),
    "the scheduler falls back to pressing Post, which would publish it early"
  );

  const pass = read("../publish/pass.ts");
  assert.match(
    pass,
    /error instanceof ScheduleUnavailableError[\s\S]{0,400}releaseScheduled/,
    "a failed preparation does not put the post back as scheduled"
  );
});

/**
 * Something has to call the sign-in.
 *
 * `signIn` was written, tested, exported, and called by nothing. An account
 * connected in the dashboard stayed at `pending` for ever, and the customer
 * watched a row promising a sign-in that no code path could ever perform. It
 * would have been found by the first real connection rather than by a test,
 * which is the expensive way round.
 */
test("a connected account is actually signed in by something", () => {
  const pass = read("../linkedin/connect-pass.ts");
  assert.match(pass, /signIn\(/, "the connect pass does not call signIn");
  assert.match(pass, /status = 'pending'/, "nothing looks for accounts waiting to sign in");

  const worker = read("../worker.ts");
  assert.match(worker, /await connectPass\(\)/, "no loop runs the connect pass");
});

/**
 * A sign-in that keeps failing has to stop, and has to say so.
 *
 * The connect loop reads every account still marked `pending`, so a mistyped
 * password means another sign-in attempt every few seconds, from one address,
 * for ever. That is the exact shape of traffic that gets a real profile
 * restricted, and the customer would meanwhile watch a spinner that never
 * resolves because nothing ever writes a failure anywhere.
 */
test("a sign-in that keeps failing stops, backs off, and tells the customer", () => {
  const src = read("../linkedin/connect-pass.ts");
  assert.match(src, /sign_in_attempts < \?/, "nothing bounds how many times a sign-in is retried");
  assert.match(src, /last_check_at <= \? -/, "failed attempts are retried with no gap between them");
  assert.match(
    src,
    /challenge_state = 'none'/,
    "an account waiting on its owner for a code is picked up again automatically"
  );
  assert.match(src, /async function givenUp/, "giving up leaves the account looking merely slow");
  // The progress line is the difference between a minute of silence and a
  // minute of "signing in". Both are a minute; only one reads as working.
  assert.match(src, /await progress\(/, "the worker never says what it is doing");
});

/**
 * One vocabulary for an account's state.
 *
 * The type said connected/checkpoint, the sign-in wrote active/challenged, and
 * the dashboard rendered active/challenged. So an account that signed in
 * successfully was invisible to every query written against the type, which
 * included publishing, analytics and the agent loader.
 */
test("the worker writes the account states the dashboard reads", () => {
  const all = ["../linkedin/signin.ts", "../db.ts", "../publish/store.ts", "../insights/pass.ts"]
    .map(read)
    .join("\n");
  assert.ok(
    !/status\s*=\s*'connected'|status\s*=\s*'checkpoint'/.test(all),
    "something still uses the account states nothing writes"
  );
  assert.match(read("../linkedin/signin.ts"), /status = 'active'/, "sign-in does not mark the account active");
});

/**
 * A window bigger than the screen kills Chrome at launch.
 *
 * The fingerprint pool holds machines up to 2560x1440 and the virtual display
 * was 1920x1080, so an account whose id hashed to the largest machine could
 * never open a browser: not slowly, not sometimes, never. Roughly one account
 * in five, and the only symptom was Chrome dying on SIGTRAP.
 */
/**
 * Chrome gets a writable home, or it does not start at all.
 *
 * The unit sandboxes the service with ProtectHome=yes and ProtectSystem=strict,
 * both of which take away the account's own /home/linkedgrow. Chrome writes
 * there regardless of --user-data-dir, so it died at launch on every account,
 * every time, saying only "chrome_crashpad_handler: --database is required".
 * The two halves of the fix live in different files and either one alone is
 * useless, which is exactly the shape of thing that rots.
 */
test("the unit gives Chrome a home it can write to", () => {
  const unit = readFileSync(new URL("../../deploy/bootstrap.sh", import.meta.url), "utf8");
  assert.match(unit, /^Environment=HOME=\$\{BROWSER_HOME\}$/m, "the unit does not set HOME at all");
  assert.match(
    unit,
    /^BROWSER_HOME="\$\{WORKER_HOME\}\/home"$/m,
    "HOME is not inside WORKER_HOME, which is the only path ReadWritePaths opens up"
  );
  assert.match(unit, /mkdir -p .*\$\{BROWSER_HOME\}/, "the home is never created");
  assert.match(
    read("../browser/driver.ts"),
    /assertWritableHome\(\)/,
    "nothing checks the home before paying for a browser launch that cannot work"
  );
});

test("the browser window can never be larger than the display it opens on", () => {
  const driver = read("../browser/driver.ts");
  assert.match(driver, /function windowFor\(/, "nothing bounds the window to the screen");
  assert.ok(
    !/--window-size=\$\{fp\.viewport/.test(driver),
    "the window is still sized straight from the fingerprint"
  );
  assert.match(driver, /viewport: windowFor\(fp\)/, "the viewport is not bounded either");
  assert.match(driver, /SCREEN_SIZE/, "the display size is hardcoded rather than read from the unit");
});
