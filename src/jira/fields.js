import api, { route } from "@forge/api";

const SPRINT_SCHEMA = "com.pyxis.greenhopper.jira:gh-sprint";

// Pure: no Jira calls, so it can be unit tested with fake data
export const pickFieldIds = (fields) => {
  const isNumber = (f) => f.schema?.type === "number";

  const storyPoints =
    fields.find((f) => f.name === "Story point estimate") ??
    fields.find((f) => f.name === "Story Points" && isNumber(f));

  // Every work item in a Software space has a hidde Sprint field that records which sprint(s) it belongs to
  const sprint = fields.find((f) => f.schema?.custom === SPRINT_SCHEMA);

  return { storyPoints: storyPoints?.id ?? null, sprint: sprint?.id ?? null };
};

// Field IDs belong to the site, not to individual items
export const getFieldIds = async () => {
  const res = await api.asUser().requestJira(route`/rest/api/3/field`);
  if (!res.ok) {
    const err = new Error(`Field lookup failed: ${res.status}`);
    err.jiraStatus = res.status;
    throw err;
  }
  return pickFieldIds(await res.json());
};
