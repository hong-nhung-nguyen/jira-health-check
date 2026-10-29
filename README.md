# Sprint Health — a Forge app for Jira

[![CI](https://github.com/hong-nhung-nguyen/jira-health-check/actions/workflows/ci.yml/badge.svg)](https://github.com/hong-nhung-nguyen/jira-health-check/actions/workflows/ci.yml)

A Jira project page that shows how the current sprint is going at a glance: what's done, what's left,
which issues need attention, and an overall **green / amber / red** health score. Unassigned and
unestimated issues can be fixed right from the page.

![Sprint Health on the BT sprint: 70 / 100 At risk](docs/screenshots/01-bt-default.png)

---

## 1. What the app does

When you open the **Sprint Health** tab in a Jira project, it looks at the active sprint and shows:

| Section             | What it shows                                                                                       |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| **Sprint header**   | Sprint name, end date and days left                                                                 |
| **Health card**     | A score from 0–100, a Healthy / At risk / Unhealthy Lozenge, and how many of each flag lowered it   |
| **Progress card**   | A segmented bar (done / in progress / to do), issue counts, and story points done                   |
| **Needs attention** | A table of flagged issues with filters by flag, and a **Fix** button to assign or estimate in place |

### The three flags

| Flag            | Rule                                                    | Why it matters                                      |
| --------------- | ------------------------------------------------------- | --------------------------------------------------- |
| **Stuck**       | In progress for more than `STUCK_DAYS` days (default 3) | Work is blocked or forgotten                        |
| **Unassigned**  | `assignee` is empty                                     | Nobody is responsible, so the issue drifts          |
| **No estimate** | The story points field is empty                         | The team can't tell whether the sprint is realistic |

One issue can have several flags. Issues that are already **Done** are never flagged. The table is
sorted by the most serious flag first (stuck, then unassigned, then no estimate).

### Health score

```
score = 100
  − 15 for each stuck issue
  − 10 for each unassigned issue
  −  5 for each unestimated issue
(never lower than 0)

🟢 Healthy   80–100
🟡 At risk   50–79
🔴 Unhealthy  0–49
```

The rule is deliberately simple, so it can be explained in one sentence. Penalties, thresholds and
`STUCK_DAYS` all live in [`src/lib/config.js`](src/lib/config.js).

### Fix in place

Click **Fix** on a flagged row to open a dialog with only the fields that issue needs:

- **Assignee:** a picker listing only people who can be assigned that issue
- **Story point estimate:** a number (0 and decimals allowed)

![Fix dialog](docs/screenshots/08-fix-dialog.png)

After saving, the panel recalculates. The fixed flag disappears, and an issue with no flags left
leaves the table. Stuck issues have no Fix button, since that needs a conversation, not a form.

### Edge cases

| Situation                        | What the app shows                                                    |
| -------------------------------- | --------------------------------------------------------------------- |
| No active sprint                 | A "No active sprint" empty state                                      |
| Every flag fixed                 | 100 / 100 Healthy and an "All clear 🎉" empty state                   |
| Site has no story points field   | A warning; estimate checks are off and progress uses issue counts     |
| Jira rejects the search (400)    | An error message with **Retry**                                       |
| No permission (401 / 403)        | A permission message, no Retry (retrying wouldn't help)               |
| Viewer hasn't granted access yet | Forge's **Allow access** prompt                                       |
| Large sprints                    | Results are paged from Jira (100 per request); tested with 150 issues |

The panel uses Atlassian design tokens, so it follows Jira's light and dark themes.

![Sprint Health in dark mode](docs/screenshots/04-bt-default-dark.png)

---

## 2. How it works

```
┌──────────────────── Jira (browser) ────────────────────┐
│  Project page tab "Sprint Health"                      │
│  src/frontend/  (UI Kit / React)                       │
│     invoke("getSprintHealth")                          │
│     invoke("getAssignableUsers") / invoke("fixIssue")  │
└─────────┼──────────────────────────────────────────────┘
          ▼
┌──────────────────── Atlassian servers ─────────────────┐
│  src/resolvers/index.js  (backend)                     │
│    1. src/jira/   calls the Jira REST API              │
│    2. src/lib/    pure logic: progress, flags, score   │
│    3. returns { sprint, progress, flagged, score, … }  │
└────────────────────────────────────────────────────────┘
```

- **`manifest.yml`** declares _where_ the app appears (`jira:projectPage`), _which code_ runs, and
  _which permissions_ (scopes) the app has.
- **Frontend:** UI Kit (`render: native`). React, but only with `@forge/react` components
  (`Heading`, `Lozenge`, `DynamicTable`, `Modal`, `Inline`, `Stack`…). **No HTML tags or CSS**, so
  the app looks like native Jira.
- **Backend (resolvers):** run on Atlassian's servers. This is the only place that talks to the
  Jira API. Every call runs **as the viewing user**, so the app never sees or changes more than
  they can.
- **Logic (`src/lib/`):** plain JavaScript with no Forge imports. It takes issues and returns
  progress, flags and a score, which keeps it easy to test and explain.

---

## 3. Where the data comes from

One JQL search gets every issue in the active sprint:

```
project = "<KEY>" AND sprint in openSprints() ORDER BY rank
```

- Endpoint: `POST /rest/api/3/search/jql`, following `nextPageToken` until every page is read.
  **Not** the old `/rest/api/3/search`, which is deprecated.
- The project key comes from the page context in the resolver (`req.context.extension.project.key`),
  so it isn't hard-coded.

| Need                       | Jira field                                                                                                             |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Done / in progress / to do | `status.statusCategory.key` → `done` / `indeterminate` / `new`                                                         |
| Owner                      | `assignee` (null = unassigned)                                                                                         |
| Estimate                   | Story points custom field. **Its ID differs between sites**, so it's looked up by name through `GET /rest/api/3/field` |
| Time in current status     | `statuscategorychangedate`                                                                                             |
| Sprint name / end date     | Sprint custom field, found by its schema (`com.pyxis.greenhopper.jira:gh-sprint`)                                      |

We use the status **category**, not the status name, so renaming "In Progress" won't break the app.

The Fix dialog uses two more endpoints:

| Purpose          | Endpoint                                            |
| ---------------- | --------------------------------------------------- |
| People to assign | `GET /rest/api/3/user/assignable/search?issueKey=…` |
| Save the change  | `PUT /rest/api/3/issue/{key}`                       |

---

## 4. Project structure

```
health-check/
├── manifest.yml                ← modules + permissions
├── src/
│   ├── index.js                ← exports the resolver handler
│   ├── resolvers/index.js      ← getSprintHealth, getAssignableUsers, fixIssue
│   ├── jira/                   ← everything that calls Jira
│   │   ├── fields.js           ← find the story points and sprint field IDs
│   │   ├── search.js           ← fetch sprint issues (with paging)
│   │   ├── normalize.js        ← raw Jira issue → simple shape
│   │   └── update.js           ← assignable users, update an issue
│   ├── lib/                    ← pure logic, unit tested
│   │   ├── config.js           ← STUCK_DAYS, penalties, thresholds
│   │   ├── health.js           ← progress, flags, score, status
│   │   ├── sprint.js           ← active sprint, days left
│   │   └── fix.js              ← validate Fix input, build the update
│   └── frontend/
│       ├── index.jsx           ← loading, error and empty states, page layout
│       └── components/         ← SprintHeader, HealthCard, ProgressCard,
│                                  NeedsAttention, FixIssueModal, flags, styles
├── test/                       ← unit tests + fixtures
└── docs/
    ├── expected-results.md     ← hand-worked results for the BT test sprint
    ├── test-report.md          ← manual and end-to-end test results
    └── screenshots/
```

### Permissions

```yaml
permissions:
  scopes:
    - read:jira-work # sprint issues and fields
    - read:jira-user # people who can be assigned, for the Fix dialog
    - write:jira-work # set assignee / story points when a user saves a fix
```

The app only writes when a user clicks **Fix** and saves.

---

## 5. Getting started

You need Node.js 24, the Forge CLI (`npm install -g @forge/cli`), and an Atlassian site with a
Jira Software space.

```bash
npm install
forge login
forge register          # gives the app your own app ID
forge deploy
forge install           # choose Jira and your site
```

Open any Software space → **Sprint Health** in the space navigation, then click **Allow access**.

### npm scripts

| Command        | What it does                                                                                             |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `npm install`  | Installs dependencies into `node_modules/`                                                               |
| `npm run lint` | Checks `src/` for mistakes with ESLint (rules in `.eslintrc`). No output means no problems.              |
| `npm test`     | Runs the unit tests with Node's built-in test runner (`node --test`), which finds every `*.test.js` file |

### Forge commands

| Command                   | When to use it                                                                                        |
| ------------------------- | ----------------------------------------------------------------------------------------------------- |
| `forge tunnel`            | While coding: code changes show up after a browser refresh, with no deploy                            |
| `forge deploy`            | After changing `manifest.yml`, or to update the deployed version                                      |
| `forge install --upgrade` | After adding a scope, so the site gets the new permissions                                            |
| `forge lint`              | Checks the manifest for mistakes before deploying                                                     |
| `forge logs`              | Shows logs from the deployed app (with the tunnel running, logs print in the tunnel terminal instead) |

Adding a scope or module makes a new major version, so deploy with
`forge deploy --approve MAJOR_VERSION_RULE`, then run `forge install --upgrade`.

---

## 6. Testing

- **Unit tests:** 57 tests over the pure logic and Jira helpers (`npm test`), using fixtures and a
  fixed "now" so date rules give the same result every run. They run on every push in GitHub Actions.
- **Expected results:** [`docs/expected-results.md`](docs/expected-results.md) works out the score,
  progress and flags for the BT test sprint by hand, before looking at the app.
- **Manual tests:** [`docs/test-report.md`](docs/test-report.md) records the checks against those
  results, scenario tests, a 150-issue load test, permissions, error states, themes and window sizes.

---

## 7. Known limitations and roadmap

### More than one active sprint in a project

The app assumes **one active sprint per project**. A project can have several at once, when:

- it has **more than one board** (e.g. two teams), each running its own sprint, or
- the site has **parallel sprints** turned on.

**What happens now:** the JQL `sprint in openSprints()` returns issues from **every** active sprint, so
progress, flags and the score are calculated across all of them together. The header shows the
**first active sprint found** (`getActiveSprints` in `src/lib/sprint.js`), so its name and days left
may not describe every issue counted.

Within a single sprint this can't go wrong: every issue in a sprint points to the same sprint object,
so they all share one name and one end date.

**Planned:**

1. **Warn:** collect all distinct active sprints (by `id`), and when there's more than one, show
   "This project has N active sprints. Showing combined health."
2. **Sprint picker:** let the user choose a sprint from a dropdown. The frontend sends the chosen
   `sprintId` to the resolver, which searches with `sprint = <id>` instead of `openSprints()`.
   The ID comes from the browser, so the resolver must accept only a whole number before putting
   it into JQL.

### Days left can differ from Jira by one

`daysLeft` is the exact time until the sprint's `endDate`, **rounded up** to whole days
(`getDaysLeft` in `src/lib/sprint.js`), so a sprint with 2 hours left shows 1 day, not 0.
Jira's own "N days remaining" counts differently and uses the site's time zone, while `endDate`
is in UTC. The two can differ by **one day**, depending on the time of day.

### Story points field detection

The story points field is found by name: "Story point estimate" first, then a **number** field
called "Story Points" (`src/jira/fields.js`). A site with an unusual setup could match the wrong
field. **Planned:** read the field the board actually uses for estimation from the board
configuration API (`/rest/agile/1.0/board/{id}/configuration`). This needs an extra Jira Software
scope.

### Fix dialog

Saving fails with a clear message when the story points field isn't on the issue's edit screen,
or the viewer can't edit the issue. The assignee picker shows the first 50 assignable people.
**Planned:** search as you type for larger teams.

### More ideas

- **Bulk fix:** select several flagged issues and assign them or set estimates in one go
  (Jira's built-in Bulk change covers this today).
- **Settings per project:** let admins change `STUCK_DAYS`, penalties and thresholds without a
  deploy.
- **Trend:** keep a daily score so teams can see whether the sprint is getting healthier.
