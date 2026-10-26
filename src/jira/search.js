import api, { route } from "@forge/api";

export const getSprintIssues = async (projectKey, fieldIds) => {
  const jql = `project = "${projectKey}" AND sprint in openSprints() ORDER BY rank`;
  // sprint in openSprints(): showing everything in the sprints running right now (started but not yet finished)
  const fields = [
    "summary",
    "status",
    "assignee",
    "statuscategorychangedate",
    fieldIds.storyPoints,
    fieldIds.sprint,
  ].filter(Boolean);

  const issues = [];
  let nextPageToken;

  do {
    // asUser: the viewer only sees issues they are allowed to see in Jira
    /**
     * ENDPOINT RETURN SHAPE
     * {
     *     issues: []
     *     nextPageToken: ...
     *     isLast: boolean
     * }
     */
    const res = await api.asUser().requestJira(route`/rest/api/3/search/jql`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ jql, fields, maxResults: 100, nextPageToken }), // what are we searching for
    });
    if (!res.ok)
      throw new Error(`Search faild: ${res.status} ${await res.text()}`);

    const page = await res.json();
    issues.push(...page.issues);
    nextPageToken = page.nextPageToken;
  } while (nextPageToken);

  return issues;
};
