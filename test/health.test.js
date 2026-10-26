import { test } from "node:test";
import assert from "node:assert/strict";
import { getProgress } from "../src/lib/health.js";
import {
  emptySprint,
  allDone,
  noPoints,
  renamedStatuses,
  btSprint,
  todo,
  inProgress,
  done,
} from "./fixtures/issues.js";

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
