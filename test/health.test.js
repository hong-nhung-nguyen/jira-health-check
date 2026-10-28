import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getProgress,
  getFlags,
  getFlaggedIssues,
  getScore,
  getStatus,
} from "../src/lib/health.js";
import { DEFAULT_CONFIG } from "../src/lib/config.js";
import {
  NOW,
  daysAgo,
  makeIssue,
  todo,
  inProgress,
  done,
  emptySprint,
  allDone,
  noPoints,
  renamedStatuses,
  allFlagged,
  btSprint,
} from "./fixtures/issues.js";
import { get } from "node:https";

// ------------- getProgress -------------

test("getProgress: empty sprint --> all zeros, no NaN", () => {
  assert.deepEqual(getProgress(emptySprint), {
    total: 0,
    done: 0,
    inProgress: 0,
    todo: 0,
    points: { total: 0, done: 0 },
    percentDone: 0,
  });
});

test("getProgress: BT sprint matches doc/expected-results.md", () => {
  assert.deepEqual(getProgress(btSprint), {
    total: 20,
    done: 11,
    inProgress: 1,
    todo: 8,
    points: { total: 56, done: 33 },
    percentDone: 59,
  });
});

test("getProgress: no points --> percent by issue count", () => {
  assert.equal(getProgress(noPoints).percentDone, 25); // 1 of 4 done
});

test("getProgress: uses statusCategory, no statusName", () => {
  const p = getProgress(renamedStatuses);
  assert.equal(p.inProgress, 1);
  assert.equal(p.done, 1);
  assert.equal(p.todo, 1);
});

test("getProgress: unestimated issues add 0 points", () => {
  const p = getProgress([
    done("BT-1", { points: 2 }),
    todo("BT-2", { points: null }),
  ]);
  assert.deepEqual(p.points, { total: 2, done: 2 });
  assert.equal(p.percentDone, 100);
});

test("getProgress: counts always add up to total", () => {
  for (const sprint of [
    emptySprint,
    allDone,
    noPoints,
    renamedStatuses,
    btSprint,
  ]) {
    const p = getProgress(sprint);
    assert.equal(p.done + p.inProgress + p.todo, p.total);
  }
});

// ------------- Flag -------------

const STUCK_0 = { ...DEFAULT_CONFIG, STUCK_DAYS: 0 };

// ------- getFlags -------
test("getFlags: healthy issue -> no flags", () => {
  assert.deepEqual(getFlags(todo("BT-1"), NOW), []);
});

test("getFlags: no assignee --> unassigned", () => {
  assert.deepEqual(getFlags(todo("BT-1", { assignee: null }), NOW), [
    "unassigned",
  ]);
});

test("getFlags: no estimate --> unestimated", () => {
  assert.deepEqual(getFlags(todo("BT-1", { points: null }), NOW), [
    "unestimated",
  ]);
});

test("getFlags: 0 point is a real estimate", () => {
  assert.deepEqual(getFlags(todo("BT-1", { points: 0 }), NOW), []);
});

test("getFlags: in progress too long --> stuck", () => {
  assert.deepEqual(
    getFlags(inProgress("BT-1", { statusSince: daysAgo(10) }), NOW),
    ["stuck"],
  );
});

test("getFlags: exactly STUCK_DAYS is NOT stuck, one more day is", () => {
  const days = DEFAULT_CONFIG.STUCK_DAYS;
  assert.deepEqual(
    getFlags(inProgress("BT-1", { statusSince: daysAgo(days) }), NOW),
    [],
  );
  assert.deepEqual(
    getFlags(inProgress("BT-1", { statusSince: daysAgo(days + 1) }), NOW),
    ["stuck"],
  );
});

test("getFlags: To Do for a long time is not a stuck", () => {
  assert.deepEqual(
    getFlags(todo("BT-1", { statusSince: daysAgo(30) }), NOW),
    [],
  );
});

test("getFlags: no statusSince date --> never stuck", () => {
  assert.deepEqual(
    getFlags(inProgress("BT-1", { statusSince: null }), NOW, STUCK_0),
    [],
  );
});

test("getFlags: Done is never flagged, even with every problem", () => {
  const issue = done("BT-1", {
    assignee: null,
    points: null,
    statusSince: daysAgo(30),
  });
  assert.deepEqual(getFlags(issue, NOW, STUCK_0), []);
});

test("getFlags: one issue can have all three flags", () => {
  const issue = inProgress("BT-1", {
    assignee: null,
    points: null,
    statusSince: daysAgo(30),
  });
  assert.deepEqual(getFlags(issue, NOW, STUCK_0), [
    "stuck",
    "unassigned",
    "unestimated",
  ]);
});

// ------- getFlaggedIssues -------
test("getFlaggedIssues: only flagged issues are returned", () => {
  assert.deepEqual(getFlaggedIssues(allDone, NOW), []);
  assert.deepEqual(getFlaggedIssues(emptySprint, NOW), []);
  assert.deepEqual(getFlaggedIssues(allFlagged, NOW).length, allFlagged.length);
});

test("getFlaggedIssues: adds flags and daysInStatus", () => {
  const [issue] = getFlaggedIssues(
    [inProgress("BT-1", { statusSince: daysAgo(10) })],
    NOW,
  );
  assert.deepEqual(issue.flags, ["stuck"]);
  assert.equal(issue.daysInStatus, 10);
});

test("getFlaggedIssues: does not change the input issues", () => {
  const input = [todo("BT-1", { assignee: null })];
  getFlaggedIssues(input, NOW);
  assert.equal("flags" in input[0], false);
});

test("getFlaggedIssues: BT sprint matches docs/expected-results.md", () => {
  const keys = getFlaggedIssues(btSprint, NOW, STUCK_0).map((i) => i.key);
  assert.deepEqual(keys, ["BT-12", "BT-14", "BT-15", "BT-16", "BT-17"]);
});

// ------------- getScore -------------

test("getScore: BT sprint with STUCK_DAYS = 0 -> 55", () => {
  const result = getScore(getFlaggedIssues(btSprint, NOW, STUCK_0));
  assert.deepEqual(result, {
    score: 55,
    breakdown: { stuck: 1, unassigned: 2, unestimated: 2 },
  });
});

test("getScore: nothing flagged -> 100", () => {
  assert.equal(getScore([]).score, 100);
});

test("getScore: never below 0", () => {
  const tenStuck = Array.from({ length: 10 }, (__, n) =>
    inProgress(`BT-${n}`, { statusSince: daysAgo(10) }),
  );
  assert.equal(getScore(getFlaggedIssues(tenStuck, NOW)).score, 0);
});

test("getScore: an issue with several flags is penalised for each", () => {
  const issue = inProgress("BT-1", {
    assignee: null,
    points: null,
    statusSince: daysAgo(10),
  });
  assert.equal(getScore(getFlaggedIssues([issue], NOW)).score, 70); // 100 - 15 - 10 - 5
});

// ------------- getStatus -------------

test("getStatus: boundaries", () => {
  assert.equal(getStatus(80), "green");
  assert.equal(getStatus(79), "amber");
  assert.equal(getStatus(50), "amber");
  assert.equal(getStatus(49), "red");
});

// ------------- Edge cases -------------
const NO_ESTIMATES = { ...DEFAULT_CONFIG, estimatesEnabled: false };

test("getFlags: estimates disabled --> no unestimated flag", () => {
  assert.deepEqual(
    getFlags(todo("BT-1", { points: null }), NOW, NO_ESTIMATES),
    [],
  );
});

test("getFlags: estimate disabled --> other flags still work", () => {
  const issue = todo("BT-1", { points: null, assignee: null });
  assert.deepEqual(getFlags(issue, NOW, NO_ESTIMATES), ["unassigned"]);
});

test("getScore: estimates disabled --> no estimate penalty", () => {
  const flagged = getFlaggedIssues(btSprint, NOW, NO_ESTIMATES);
  assert.deepEqual(getScore(flagged, NO_ESTIMATES).breakdown, {
    stuck: 0,
    unassigned: 2,
    unestimated: 0,
  });
});
