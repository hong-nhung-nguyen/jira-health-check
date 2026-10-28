// Turns one raw Jira issue into the simple shape the health logic uses
// id, key, self, fields

export const normalizeIssue = (raw, fieldIds) => {
  const f = raw.fields ?? {};
  const points = fieldIds.storyPoints ? f[fieldIds.storyPoints] : null;

  return {
    key: raw.key,
    summary: f.summary ?? "",
    statusName: f.status?.name ?? "",
    statusCategory: f.status?.statusCategory?.key ?? "new", // "new" | "indeterminate" | "done"
    /**
     * UI Kit's User component shows a real Jira avatar, but it needs the accountID
     * not the displayed name
     */
    assignee: f.assignee?.displayName ?? null, // null = unassigned
    assigneeId: f.assignee?.accountId ?? null, // for the avatar in the table
    points: typeof points === "number" ? points : null, // null = unestimated, 0 is a real estimate
    statusSince: parseJiraDate(f.statuscategorychangedate),
    url: `/browse/${raw.key}`,
  };
};

// convert date into ISO 24hr
export const parseJiraDate = (value) => {
  if (!value) return null;
  const date = new Date(value.replace(/([+-]\d{2})(\d{2})$/, "$1:$2"));
  // returns null instead of an invalid date
  return Number.isNaN(date.getTime()) ? null : date;
};
