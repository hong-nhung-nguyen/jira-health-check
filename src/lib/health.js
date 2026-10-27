/**
 * + getProgress()
 * + getFlags()
 * + getFlaggedIssues()
 * + getScore()
 * + getStatus()
 */

import { DEFAULT_CONFIG } from "./config.js";

export const getProgress = (issues) => {
  let todo = 0,
    inProgress = 0,
    done = 0;
  const totalPoints = issues.reduce((total, i) => total + (i.points ?? 0), 0);
  let donePoints = 0;

  for (const i of issues) {
    if (i.statusCategory === "done") {
      done++;
      donePoints += i.points ?? 0;
    } else if (i.statusCategory === "indeterminate") {
      inProgress++;
    } else {
      todo++;
    }
  }

  let percentDone;

  if (totalPoints > 0) {
    percentDone = Math.round((donePoints / totalPoints) * 100);
  } else {
    percentDone =
      issues.length > 0 ? Math.round((done / issues.length) * 100) : 0;
  }

  return {
    total: issues.length,
    done,
    inProgress,
    todo,
    points: { total: totalPoints, done: donePoints },
    percentDone,
  };
};

// ---------------- Flag rules ------------------------

/**
 * Flag Rules
 * + unassigned: assignee = null
 * + unestimated: points = null (0 is a real estimate)
 * + stuck: {
 *      statusCategory = indeterminate
 *      statusSince != null
 *      daysInStatus > STUCK_DAYS
 * }
 */

const SEVERITY = { stuck: 0, unassigned: 1, unestimated: 2 };
const worstRank = (issue) => Math.min(...issue.flags.map((f) => SEVERITY[f]));
/**
 * Sort: stuck first, then unassigned, then unestimated
 * Ties go to whichever has been in its status longest
 */
const bySeverity = (a, b) =>
  worstRank(a) - worstRank(b) || (b.daysInStatus ?? 0) - (a.daysInStatus ?? 0);

const getDaysInStatus = (issue, now = new Date()) => {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return issue.statusSince
    ? Math.floor((now - issue.statusSince) / MS_PER_DAY)
    : null;
};

export const getFlags = (issue, now = new Date(), config = DEFAULT_CONFIG) => {
  if (issue.statusCategory === "done") return [];

  let flags = [];

  if (
    issue.statusCategory === "indeterminate" &&
    issue.statusSince !== null &&
    getDaysInStatus(issue, now) > config.STUCK_DAYS
  ) {
    flags.push("stuck");
  }

  if (issue.assignee === null) {
    flags.push("unassigned");
  }

  if (issue.points === null) {
    flags.push("unestimated");
  }

  return flags;
};

export const getFlaggedIssues = (
  issues,
  now = new Date(),
  config = DEFAULT_CONFIG,
) =>
  issues
    .map((issue) => ({
      ...issue,
      flags: getFlags(issue, now, config),
      daysInStatus: getDaysInStatus(issue, now),
    }))
    .filter((issue) => issue.flags.length > 0)
    .sort(bySeverity);
