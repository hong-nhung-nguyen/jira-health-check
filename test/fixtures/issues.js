// Test data in the normalised shape from src/jira/normalize.js

// Fixed "today" for every health test
export const NOW = new Date("2026-10-28T00:00:00Z");

const DAY_MS = 24 * 60 * 60 * 1000;
export const daysAgo = (n) => new Date(NOW.getTime() - n * DAY_MS);

// Builds one normalised issue, override only what a test wants to add extra
export const makeIssue = (overrides = {}) => ({
  key: "BT-0",
  summary: "Test issue",
  statusName: "To Do",
  statusCategory: "new",
  assignee: "Hong Nhung Nguyen",
  points: 3,
  statusSince: daysAgo(1),
  url: "https://example.atlassian.net/browse/BT-0",
  ...overrides,
});

// Shortcuts for the three status categories
export const todo = (key, extra = {}) =>
  makeIssue({ key, statusName: "To Do", statusCategory: "new", ...extra });
export const inProgress = (key, extra = {}) =>
  makeIssue({
    key,
    statusName: "In Progress",
    statusCategory: "indeterminate",
    ...extra,
  });
export const done = (key, extra = {}) =>
  makeIssue({ key, statusName: "Done", statusCategory: "done", ...extra });

// ---------------------------------------------------------------- small sprints

export const emptySprint = [];

// Done issues are never flagged, even with no owner or estimate
export const allDone = [
  done("BT-1"),
  done("BT-2", { assignee: null }),
  done("BT-3", { points: null }),
  done("BT-4", { assignee: null, points: null }),
  done("BT-5", { points: 5 }),
];

// No issue has points --> progress falls back to issue count
export const noPoints = [
  done("BT-1", { points: null }),
  inProgress("BT-2", { points: null }),
  todo("BT-3", { points: null }),
  todo("BT-4", { points: null }),
];

// Renamed statuses: only statusCategory should matter
export const renamedStatuses = [
  makeIssue({
    key: "BT-1",
    statusName: "In Review",
    statusCategory: "indeterminate",
  }),
  makeIssue({ key: "BT-2", statusName: "Backlog", statusCategory: "new" }),
  makeIssue({ key: "BT-3", statusName: "Closed", statusCategory: "done" }),
];

// Every issue has every flag (stuck for 10 days, unassigned, unestimated)
export const allFlagged = [
  inProgress("BT-1", {
    assigneed: null,
    points: null,
    statusSince: daysAgo(10),
  }),
  inProgress("BT-2", {
    assignee: null,
    points: null,
    statusSince: daysAgo(10),
  }),
];

// ---------------------------------------------------------------- BT sprint
// Mirrors docs/expected-results.md:
// 20 issues → 8 to do, 1 in progress, 11 done
// points 56 total, 33 done → 59%
// unassigned BT-14, BT-15 · unestimated BT-16, BT-17 · BT-12 in progress since 26 Oct

export const btSprint = [
  // 11 done × 3 points = 33
  done("BT-1"),
  done("BT-2"),
  done("BT-3"),
  done("BT-4"),
  done("BT-5"),
  done("BT-6"),
  done("BT-7"),
  done("BT-8"),
  done("BT-9"),
  done("BT-10"),
  done("BT-11"),

  // 1 in progress, 5 points
  inProgress("BT-12", {
    points: 5,
    statusSince: new Date("2026-10-26T12:04:02.731Z"),
  }),

  // 8 to do: 6 × 3 points = 18, two unestimated
  todo("BT-13"),
  todo("BT-14", { assignee: null }),
  todo("BT-15", { assignee: null }),
  todo("BT-16", { points: null }),
  todo("BT-17", { points: null }),
  todo("BT-18"),
  todo("BT-19"),
  todo("BT-20"),
];
// Check: 33 done + 5 + 18 = 56 total points
