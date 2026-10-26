import { test } from "node:test";
import assert from "node:assert/strict";
import { getActiveSprints, getDaysLeft } from "../src/lib/sprint.js";
import { get } from "node:http";

// Fixed "today" so results never change with the real date
const NOW = new Date("2026-10-26T00:00:00Z");
const SPRINT_FIELD = "customfield_10020";

const activeSprint = {
  id: 1,
  name: "BOOK Sprint 1",
  state: "active",
  startDate: "2026-10-26T00:00:00Z",
  endDate: "2026-10-29T00:00:00Z",
};
const closedSprint = {
  ...activeSprint,
  id: 0,
  name: "BOOK Sprint 0",
  state: "closed",
};
// Builds a fake Jira issue object
const issueIn = (...sprints) => ({
  fields: { [SPRINT_FIELD]: sprints },
});

// ------------- getDaysLeft ---------------
test("getDaysLeft: 3 days ahead -> 3", () => {
  assert.equal(getDaysLeft("2026-10-29T00:00:00Z", NOW), 3);
});

test("getDaysLeft: part of a day left rounds up to 1", () => {
  assert.equal(getDaysLeft("2026-10-26T02:00:00Z", NOW), 1);
});

test("getDaysLeft: end date in the past -> 0", () => {
  assert.equal(getDaysLeft("2026-10-20T00:00:00Z", NOW), 0);
});

test("getDaysLeft: missing end date -> null", () => {
  assert.equal(getDaysLeft(null, NOW), null);
  assert.equal(getDaysLeft(undefined, NOW), null);
});

// ------------- getActiveSprint ---------------
test("getActiveSprint: returns the active sprint with daysLeft", () => {
  assert.deepEqual(
    getActiveSprints([issueIn(activeSprint)], SPRINT_FIELD, NOW),
    {
      id: 1,
      name: "BOOK Sprint 1",
      startDate: "2026-10-26T00:00:00Z",
      endDate: "2026-10-29T00:00:00Z",
      daysLeft: 3,
    },
  );
});

test("getActiveSprint: picks the active one when an issue was in an earlier sprint too", () => {
  const result = getActiveSprints(
    [issueIn(closedSprint, activeSprint)],
    SPRINT_FIELD,
    NOW,
  );
  assert.equal(result.name, "BOOK Sprint 1");
});

test("getActiveSprint: no sprint field id --> null", () => {
  assert.equal(getActiveSprints([issueIn(activeSprint)], null, NOW), null);
});

test("getActiveSprint: no issues --> null", () => {
  assert.equal(getActiveSprints([], SPRINT_FIELD, NOW), null);
});

test("getActiveSprint: issue without the sprint field --> null", () => {
  assert.equal(getActiveSprints([{ fields: {} }], SPRINT_FIELD, NOW), null);
});

test("getActiveSprint: only closed sprint --> null", () => {
  assert.equal(
    getActiveSprints([issueIn(closedSprint)], SPRINT_FIELD, NOW),
    null,
  );
});
