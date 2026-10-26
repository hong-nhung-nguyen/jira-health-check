import { test } from "node:test";
import assert from "node:assert/strict";
import { pickFieldIds } from "../src/jira/fields.js";

const sprintField = {
  id: "customfield_10020",
  name: "Sprint",
  schema: {
    type: "array",
    custom: "com.pyxis.greenhopper.jira:gh-sprint",
  },
};

test("prefers 'Story point estimate' when both exist", () => {
  const fields = [
    { id: "cf_text", name: "Story Points", schema: { type: "string" } },
    { id: "cf_sp", name: "Story point estimate", schema: { type: "number" } },
    sprintField,
  ];
  assert.deepEqual(pickFieldIds(fields), {
    storyPoints: "cf_sp",
    sprint: "customfield_10020",
  });
});

test("falls back to numeric 'Story Points'", () => {
  const fields = [
    { id: "cf_num", name: "Story Points", schema: { type: "number" } },
  ];
  assert.equal(pickFieldIds(fields).storyPoints, "cf_num");
});

test("ignores a text Story Points field", () => {
  const fields = [
    { id: "cf_text", name: "Story Points", schema: { type: "string" } },
  ];
  assert.equal(pickFieldIds(fields).storyPoints, null);
});

test("finds sprint by schema if renamed", () => {
  const fields = [{ ...sprintField, name: "Iteration" }];
  assert.equal(pickFieldIds(fields).sprint, "customfield_10020");
});

test("returns null when nothing matches, and handles fields with no schema", () => {
  const fields = [{ id: "summary", name: "Summary" }];
  assert.deepEqual(pickFieldIds(fields), { storyPoints: null, sprint: null });
});
