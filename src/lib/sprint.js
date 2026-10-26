export const getActiveSprints = (
  rawIssues,
  sprintFieldId,
  now = new Date(),
) => {
  if (!sprintFieldId) return null;
  for (const issue of rawIssues) {
    const sprints = issue.fields?.[sprintFieldId] ?? [];
    const active = sprints.find((s) => s.state === "active");
    if (active) {
      return {
        id: active.id,
        name: active.name,
        startDate: active.startDate,
        endDate: active.endDate,
        daysLeft: getDaysLeft(active.endDate, now),
      };
    }
  }
  return null;
};

export const getDaysLeft = (endDate, now) => {
  if (!endDate) return null;

  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  const diffMs = new Date(endDate) - now;
  const days = Math.ceil(diffMs / MS_PER_DAY);

  return Math.max(0, days);
};

/*
SAMPLE ISSUE SHAPE
{
  "id": "10042",
  "key": "BT-7",
  "self": "https://your-site.atlassian.net/rest/api/3/issue/10042",
  "fields": {
    "summary": "Build vulnerable login endpoint",
    "issuetype": { "id": "10001", "name": "Story" },
    "status": {
      "name": "In Progress",
      "statusCategory": { "key": "indeterminate", "name": "In Progress" }
    },
    "assignee": {
      "accountId": "5f1a...",
      "displayName": "Tom Dang",
      "avatarUrls": { "48x48": "https://..." }
    },
    "reporter": { "accountId": "...", "displayName": "..." },
    "priority": { "id": "3", "name": "Medium" },
    "created": "2026-10-15T10:12:00.000+1100",
    "updated": "2026-10-20T14:30:00.000+1100",
    "statuscategorychangedate": "2026-10-18T09:00:00.000+1100",
    "customfield_10016": 3,
    "customfield_10020": [
      {
        "id": 1,
        "name": "BOOK Sprint 1",
        "state": "active",
        "startDate": "2026-10-15T...",
        "endDate": "2026-10-29T..."
      }
    ]
  }
}
*/
