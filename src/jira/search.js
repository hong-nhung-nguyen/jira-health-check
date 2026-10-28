import api, { route } from "@forge/api";

export const getSprintIssues = async (projectKey, fieldIds) => {
  const jql = `project = "${projectKey}" AND sprint in openSprints() ORDER BY rank`;
  // const jql = `project = "${projectKey}" AND AND sprint in openSprints() ORDER BY rank`; // FOR TESTING

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

    // jiraStatus: our error from a jira response
    if (!res.ok) {
      const err = new Error(`Search failed: ${res.status} ${await res.text()}`);
      err.jiraStatus = res.status;
      throw err;
    }

    const page = await res.json();
    issues.push(...page.issues);
    nextPageToken = page.nextPageToken;
  } while (nextPageToken);

  return issues;
};
