import Resolver from "@forge/resolver"; // Loads the Resolver class, which lets define backend functions and frontend can call by name
/**
 * Loads the tools for calling jira's REST APIs
 * + api: object that makes requests (api.asUser(), api.asApp())
 * + route: builds API URLs safely
 */
import api, { route } from "@forge/api";

import { getFieldIds } from "../jira/fields";
import { getSprintIssues } from "../jira/search";
import { getActiveSprints } from "../lib/sprint";
import { normalizeIssue } from "../jira/normalize";
import { getProgress } from "../lib/health";
const resolver = new Resolver(); // Creates a resolver

/**
 * Register a function called getText. The name has to match what the frontend calls
 *
 * --- src/frontend/index.jsx
 * invoke('getText', { example: 'my-invoke-variable' })
 *
 * + req: holds what the frontend sent
 *    - req.payload: the data passed in ( { example: 'my-invoke-variable' })
 *    - req.context: info about where the page is open (e.g. req.context.extension.project.key === "BT")
 */
resolver.define("getText", async (req) => {
  // Returns undefined instead of crashing if the page wasn't opened from a project
  const projectKey = req.context?.extension?.project?.key;
  if (!projectKey) {
    return { error: "NO_PROJECT_CONTEXT" };
  }
  console.log("projectKey", projectKey);

  // get story point and sprint ids
  const fieldIds = await getFieldIds();
  console.log("fieldIds", fieldIds);

  // get active sprint issues
  const issues = await getSprintIssues(projectKey, fieldIds);
  console.log(`fetched ${issues.length} issues`);

  // normalize issue shape
  const simpleIssues = issues.map((raw) => normalizeIssue(raw, fieldIds));
  console.log("issues", simpleIssues);

  // calculate progress (done vs. remaining)
  const sprintProgress = getProgress(simpleIssues);
  console.log("progress", sprintProgress);

  // get sprint name, dates, and remaining days
  const sprint = getActiveSprints(issues, fieldIds.sprint);
  console.log("sprint meta", sprint);

  /**
   * + api.asUser(): make the request as the person viewing the page (That's why we have
   *    the Allow Access button --> they only see data they are already allowed to see)
   *
   * + .requestJira(...): sends an HTTP request to this Jira site. Forge fills in the site
   *    addreass and login for you, so there is no URL or API in the code
   *
   * + route`/rest/api/3/myself`: the endpoint path that returns the current user's details
   */
  const res = await api.asUser().requestJira(route`/rest/api/3/myself`);
  console.log("myself status", res.status);
  return `Jira API status: ${res.status}`;
});

export const handler = resolver.getDefinitions();
