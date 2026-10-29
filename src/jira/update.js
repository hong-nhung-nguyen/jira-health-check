import api, { route } from "@forge/api";

const failed = async (res, what) => {
  const err = new Error(`${what} failed: ${res.status} ${await res.text()}`);
  err.jiraStatus = res.status;
  return err;
};

// People that are allowed to be assigned this issue (not everyone on the site)
export const getAssignableUsers = async (issueKey) => {
  const res = await api
    .asUser()
    /**
     * Assignment permissions are set per project, not site-wide,
     * checking the issueKey tells which project are we currently looking up of
     */
    .requestJira(
      route`/rest/api/3/user/assignable/search?issueKey=${issueKey}&maxResults=50`,
    );
  if (!res.ok) throw await failed(res, "Assignable users lookup");

  const users = await res.json();
  return users
    .filter((u) => u.accountType === "atlassian") // hide apps and bots
    .map((u) => ({ accountId: u.accountId, displayName: u.displayName }));
};

// asUser: Jira checks the viewer's own edit permission
export const updateIssue = async (issueKey, fields) => {
  const res = await api
    .asUser()
    .requestJira(route`/rest/api/3/issue/${issueKey}`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    });

  if (!res.ok) throw await failed(res, "Issue update");

  // A successful PUT returns 204 No Content --> no body to read
};
