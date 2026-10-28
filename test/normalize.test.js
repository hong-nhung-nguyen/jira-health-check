import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs"; // reads a file and returns its content
import { normalizeIssue, parseJiraDate } from "../src/jira/normalize.js";

const raw = JSON.parse(
  readFileSync(new URL("./fixtures/raw-issue.json", import.meta.url)),
);
const FIELD_IDS = {
  storyPoints: "customfield_10016",
  sprint: "customfield_10020",
};

test("normalizes a real Jira issue into a simple shape", () => {
  const issue = normalizeIssue(raw, FIELD_IDS);
  assert.deepEqual(Object.keys(issue).sort(), [
    "assignee",
    "assigneeId",
    "key",
    "points",
    "statusCategory",
    "statusName",
    "statusSince",
    "summary",
    "url",
  ]);
  assert.equal(issue.key, "BT-12");
  assert.equal(issue.statusCategory, "indeterminate");
  assert.equal(typeof issue.points, "number");
  assert.ok(issue.statusSince instanceof Date);
  assert.ok(issue.url.endsWith("/browse/BT-12"));
});

test("unassgined --> assignee null", () => {
  const copy = structuredClone(raw); // deep copy of a value, never touches the origin
  copy.fields.assignee = null;
  assert.equal(normalizeIssue(copy, FIELD_IDS).assignee, null);
});

test("no estimate --> points null", () => {
  const copy = structuredClone(raw);
  copy.fields[FIELD_IDS.storyPoints] = null;
  assert.equal(normalizeIssue(copy, FIELD_IDS).points, null);
});

test("0 point is a real estimate, not null", () => {
  const copy = structuredClone(raw);
  copy.fields[FIELD_IDS.storyPoints] = 0;
  assert.equal(normalizeIssue(copy, FIELD_IDS).points, 0);
});

(test("no story points field on the site --> points null"),
  () => {
    assert.equal(
      normalizeIssue(raw, { ...FIELD_IDS, storyPoints: null }).points,
      null,
    );
  });

test("parseJiraDate handles Jira's +1100 offset", () => {
  assert.equal(
    parseJiraDate("2026-10-26T13:00:00.000+1100").toISOString(),
    "2026-10-26T02:00:00.000Z",
  );
});

test("parseJiraDate: missing or invalid --> null", () => {
  assert.equal(parseJiraDate(null), null);
  assert.equal(parseJiraDate("not a date"), null);
});

test("issue that never changed status category --> statusSince null", () => {
  const copy = structuredClone(raw);
  copy.fields.statuscategorychangedate = null;
  assert.equal(normalizeIssue(copy, FIELD_IDS).statusSince, null);
});
