import { test } from "node:test";
import assert from "node:assert/strict";
import { editionFrom, assertEditionConsistency } from "./edition";

test("default edition is self-hosted", () => {
  assert.equal(editionFrom({}), "self-hosted");
  assert.equal(editionFrom({ LINKEDGROW_EDITION: "cloud" }), "cloud");
  assert.equal(editionFrom({ LINKEDGROW_EDITION: "SELF-HOSTED" }), "self-hosted");
});

test("an unknown value is refused loudly", () => {
  assert.throws(() => editionFrom({ LINKEDGROW_EDITION: "enterprise" }), /LINKEDGROW_EDITION/);
});

test("cloud secrets without the cloud flag stop the boot", () => {
  assert.throws(
    () => assertEditionConsistency({ STRIPE_SECRET_KEY: "sk_test_x" }),
    /cloud secrets present but LINKEDGROW_EDITION is not cloud/
  );
  assert.throws(() => assertEditionConsistency({ QSTASH_TOKEN: "q" }), /cloud secrets/);
  assert.doesNotThrow(() => assertEditionConsistency({ STRIPE_SECRET_KEY: "sk", LINKEDGROW_EDITION: "cloud" }));
  assert.doesNotThrow(() => assertEditionConsistency({}));
});
