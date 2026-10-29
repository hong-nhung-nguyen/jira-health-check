export const parsePoints = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

// Only the fields the user actually set up go to Jira
export const buildFixFields = ({ accountId, points }, storyPointFieldId) => {
  const fields = {};
  if (accountId) fields.assignee = { accountId };
  if (points !== null && storyPointFieldId) fields[storyPointFieldId] = points;
  return fields;
};
