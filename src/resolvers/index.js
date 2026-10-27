import Resolver from "@forge/resolver"; // Loads the Resolver class, which lets define backend functions and frontend can call by name

import { getFieldIds } from "../jira/fields";
import { getSprintIssues } from "../jira/search";
import { getActiveSprints } from "../lib/sprint";
import { normalizeIssue } from "../jira/normalize";
import {
  getProgress,
  getFlaggedIssues,
  getScore,
  getStatus,
} from "../lib/health";
import { DEFAULT_CONFIG } from "../lib/config";
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
resolver.define("getSprintHealth", async (req) => {
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

  // normalize issue shape
  const simpleIssues = issues.map((raw) => normalizeIssue(raw, fieldIds));

  // calculate sprint progress (done vs. remaining)
  const progress = getProgress(simpleIssues);

  // get flagged issues
  const flagged = getFlaggedIssues(simpleIssues, new Date());

  // get sprint name, dates, and remaining days
  const sprint = getActiveSprints(issues, fieldIds.sprint);

  const { score, breakdown } = getScore(flagged);
  const status = getStatus(score);

  /**
   * + api.asUser(): make the request as the person viewing the page (That's why we have
   *    the Allow Access button --> they only see data they are already allowed to see)
   *
   * + .requestJira(...): sends an HTTP request to this Jira site. Forge fills in the site
   *    addreass and login for you, so there is no URL or API in the code
   *
   * + route`/rest/api/3/myself`: the endpoint path that returns the current user's details
   */
  // const res = await api.asUser().requestJira(route`/rest/api/3/myself`);

  return {
    sprint,
    progress,
    flagged,
    score,
    status,
    breakdown,
    config: DEFAULT_CONFIG,
  };
});

export const handler = resolver.getDefinitions();
