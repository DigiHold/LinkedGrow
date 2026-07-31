import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * The rule this file exists to hold: money can leave once per row, ever.
 *
 * On 2026-07-30 it left twice. The supplier pays an order and provisions the
 * address a second or two later; the code read the listing once, immediately,
 * found nothing, threw, and left the row waiting. Five minutes later the next
 * pass bought a second French address for the same customer. The error message
 * even said "was paid for", and the loop retried anyway.
 *
 * Asserted on the source rather than by mocking the supplier, because what went
 * wrong was the order of two statements, and a mock would have been written
 * with the same assumption that produced the bug.
 */
const src = readFileSync(new URL("./fulfil.ts", import.meta.url), "utf8");

test("the order id is written down before anything else can fail", () => {
  const make = src.indexOf('"order/make"');
  const record = src.indexOf("await recordOrder(", make);
  const lookup = src.indexOf("await addressForOrder(", make);
  const exitCheck = src.indexOf("await checkExit(", make);

  assert.ok(make > 0, "nothing buys an address any more");
  assert.ok(record > make, "the order id is not recorded after buying");
  assert.ok(
    record < lookup,
    "the address lookup runs before the order id is written down, so a failed lookup buys again"
  );
  assert.ok(record < exitCheck, "the exit check runs before the order is written down");
});

test("a row that has already paid is never bought a second time", () => {
  // The guard is the shape `if (!orderId) { ...buy... }`, and the value comes
  // from the row rather than from anything computed in this pass.
  const fn = src.slice(src.indexOf("async function fulfil("));
  const body = fn.slice(0, fn.indexOf("\n}\n"));
  const guard = body.indexOf("if (!orderId)");
  const buy = body.indexOf('"order/make"');
  assert.ok(guard > 0, "there is no guard on an order that already happened");
  assert.ok(guard < buy, "the purchase is not inside the guard");
  assert.match(
    src,
    /providerRef:\s*string/,
    "fulfil does not receive what the row already paid for"
  );
  assert.match(
    src,
    /COALESCE\(provider_ref, ''\) AS provider_ref/,
    "the loader does not read the order id back, so the guard can never see it"
  );
});

test("the address is waited for rather than read once", () => {
  const fn = src.slice(src.indexOf("async function addressForOrder("));
  const body = fn.slice(0, fn.indexOf("\n}\n"));
  assert.match(body, /deadline/, "there is no deadline, so it reads once and gives up");
  assert.match(body, /setTimeout/, "it does not wait between attempts");
  // And it must give up by returning, not by throwing, so the caller can say
  // the money is safe and the next pass will look again.
  assert.match(body, /return null/, "it throws instead of reporting nothing found");
});

test("the final write keeps the order id rather than replacing it with the proxy id", () => {
  const update = src.slice(src.indexOf("UPDATE proxy_allocations\n             SET host"));

  const args = update.slice(0, update.indexOf("});"));
  assert.ok(
    !/String\(mine\.id/.test(args),
    "the proxy row id overwrites the order id, which would let a later failure buy again"
  );
  assert.match(args, /String\(orderId\)/, "the order id is not preserved");
});

/**
 * An address is only in the country it is REGISTERED in.
 *
 * The purchase check asked one geolocation database and believed it. On
 * 2026-07-31 that database said Paris about 213.164.108.143 while the RIPE
 * record for its block said netname BITE-HRS, country LT, and LinkedIn emailed
 * Nicolas three times about the same address: Paris once, Vilnius twice. An
 * account that appears to move between countries is worse off than one seen
 * consistently from the wrong one, because the browser is meanwhile insisting
 * its timezone is Europe/Paris.
 */
test("a bought address is checked against the registry, not just a geo database", () => {
  const src = readFileSync(new URL("./fulfil.ts", import.meta.url), "utf8");
  assert.match(src, /export async function registryCountry/, "nothing reads the registry");
  assert.match(src, /rdap/i, "the registry is not queried over RDAP");
  assert.match(
    src,
    /exit\.registryCountry &&[\s\S]{0,120}!==[\s\S]{0,80}throw new Error/,
    "a registration in the wrong country does not stop the purchase"
  );
});
