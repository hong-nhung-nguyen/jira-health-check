import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePoints, buildFixFields } from "../src/lib/fix.js";

test("parsePoints accepts while and decimal numbers, including 0", () => {
  assert.equal(parsePoints("3"), 3);
  assert.equal(parsePoints("0.5"), 0.5);
  assert.equal(parsePoints(0), 0);
  assert.equal(parsePoints("five"), null);
});

test("parsePoints rejects empty, negative, and non-numbers", () => {
  for (const reject of ["", "-1", "abc", null, undefined]) {
    assert.equal(parsePoints(reject), null);
  }
});

test("buildFixFields sends only what was set", () => {
  assert.deepEqual(
    buildFixFields({ accountId: "abc", points: null }, "customfield_10016"),
    {
      assignee: { accountId: "abc" },
    },
  );
  assert.deepEqual(
    buildFixFields({ accountId: null, points: 3 }, "customfield_10016"),
    {
      customfield_10016: 3,
    },
  );
  assert.deepEqual(
    buildFixFields({ accountId: null, points: null }, "customfield_10016"),
    {},
  );
});

test("buildFixFields skips points when the site has no story points field", () => {
  assert.deepEqual(buildFixFields({ accountId: null, points: 3 }, null), {});
});
