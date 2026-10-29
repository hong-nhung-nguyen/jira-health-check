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
import { getAssignableUsers, updateIssue } from "../jira/update";
import { parsePoints, buildFixFields } from "../lib/fix";
import { DEFAULT_CONFIG } from "../lib/config";
const resolver = new Resolver(); // Creates a resolver

// Turns a Jira HTTP status into a code the frontend understands
const toErrorCode = (status) => {
  if (status === 401 || status === 403) return "FORBIDDEN";
  if (status === 400) return "BAD_REQUEST";
  return "UNKNOWN";
};

/**
 * asUser() throws 401 when the viewer hasn't clicked Allow Access
 * Forge needs that error to reach the frontend to show the consent prompt
 * --> do not catch
 */
const isConsentError = (err) =>
  err?.status === 401 && err?.jiraStatus === undefined;

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
    return {
      error: {
        code: "NO_PROJECT_CONTEXT",
        message: "Open Sprint Health from a project.",
      },
    };
  }

  try {
    // throw Object.assign(new Error("test"), { jiraStatus: 403 }); // TEST FORBIDDEN 403 ERR
    // throw Object.assign(new Error("test"), { jiraStatus: 500 }); // TEST 500 ERR

    // get story point and sprint ids
    const fieldIds = await getFieldIds();
    // const fieldIds = { ...(await getFieldIds()), storyPoints: null }; //-- FOR TESTING

    // sites without a story points field: don't flag missing estimates
    const config = {
      ...DEFAULT_CONFIG,
      estimatesEnabled: fieldIds.storyPoints !== null,
    };

    // get active sprint issues
    const rawIssues = await getSprintIssues(projectKey, fieldIds);

    if (rawIssues.length === 0) {
      return { empty: "NO_ACTIVE_SPRINT" };
    }

    // normalize issue shape
    const simpleIssues = rawIssues.map((raw) => normalizeIssue(raw, fieldIds));

    // calculate sprint progress (done vs. remaining)
    const progress = getProgress(simpleIssues);

    // get flagged issues
    const flagged = getFlaggedIssues(simpleIssues, new Date(), config);

    // get sprint name, dates, and remaining days
    const sprint = getActiveSprints(rawIssues, fieldIds.sprint);

    const { score, breakdown } = getScore(flagged, config);
    const status = getStatus(score, config);

    return {
      sprint,
      progress,
      flagged,
      score,
      status,
      breakdown,
      config,
    };
  } catch (err) {
    if (isConsentError(err)) throw err;

    return {
      error: {
        code: toErrorCode(err.jiraStatus),
        message: "Couldn't read sprint data from Jira",
      },
    };
  }
});

// Only allow issues from the project the page is open in
const isInProject = (req, issueKey) => {
  const projectKey = req.context?.extension?.project?.key;
  return (
    Boolean(projectKey) &&
    typeof issueKey === "string" &&
    issueKey.startsWith(`${projectKey}-`)
  );
};

resolver.define("getAssignableUsers", async (req) => {
  const { issueKey } = req.payload;
  if (!isInProject(req, issueKey)) {
    return { error: { code: "BAD_REQUEST" } };
  }

  try {
    return { users: await getAssignableUsers(issueKey) };
  } catch (err) {
    if (isConsentError(err)) throw err;
    console.error("getAssignableUsers failed", err.jiraStatus, err.message);
    return {
      error: {
        code: toErrorCode(err.jiraStatus),
      },
    };
  }
});

resolver.define("fixIssue", async (req) => {
  const { issueKey, accountId, points } = req.payload;
  if (!isInProject(req, issueKey)) {
    return {
      error: {
        code: "BAD_REQUEST",
      },
    };
  }

  try {
    const fieldIds = await getFieldIds();
    /**
     * payload: data that frontend sends
     * validate again on the server: never trust what the frontend sends
     */
    const fields = buildFixFields(
      { accountId, points: parsePoints(points) },
      fieldIds.storyPoints,
    );
    if (Object.keys(fields).length === 0)
      return {
        error: {
          code: "BAD_REQUEST",
        },
      };

    await updateIssue(issueKey, fields);
    return { ok: true };
  } catch (err) {
    if (isConsentError(err)) throw err;
    console.error("fixIssue failed", err.jiraStatus, err.message);
    return {
      error: {
        code: toErrorCode(err.jiraStatus),
      },
    };
  }
});

export const handler = resolver.getDefinitions();
