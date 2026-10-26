# Sprint Health — a Forge app for Jira

A Jira project page that shows how the current sprint is going at a glance: what's done, what's left,
which tickets need attention, and an overall **green / amber / red** health score.

---

## 1. What the app does

When you open the **Sprint Health** tab in a Jira project, it looks at the active sprint and shows:

| Section | What it shows |
|---|---|
| **Health score** | A number from 0–100 plus a 🟢 / 🟡 / 🔴 badge |
| **Progress** | Done vs remaining, by issue count and by story points, with a progress bar |
| **Needs attention** | A table of flagged issues and why each one was flagged |

### The three flags

| Flag | Rule | Why it matters |
|---|---|---|
| **No owner** | `assignee` is empty | Nobody is responsible, so the issue drifts |
| **No estimate** | The story points field is empty | The team can't tell whether the sprint is realistic |
| **Stuck** | In Progress for more than `STUCK_DAYS` days (default 3) | Work is blocked or forgotten |

One issue can have several flags. Issues that are already **Done** are never flagged.

### Health score (starting rule, easy to tune)

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

The rule is deliberately simple, so it can be explained in one sentence.

---

## 2. How a Forge app works (the short version)

```
┌────────────── Jira (browser) ──────────────┐
│  Project page tab "Sprint Health"          │
│  src/frontend/index.jsx  (UI Kit / React)  │
│        │  invoke('getSprintHealth')        │
└────────┼───────────────────────────────────┘
         ▼
┌────────────── Atlassian servers ───────────┐
│  src/resolvers/index.js  (backend)         │
│    1. calls the Jira REST API              │
│    2. passes issues to src/lib/health.js   │
│    3. returns { score, progress, flags }   │
└────────────────────────────────────────────┘
```

- **`manifest.yml`** declares *where* the app appears (`jira:projectPage`), *which code* runs, and
  *which permissions* (scopes) the app has.
- **Frontend**: UI Kit (`render: native`). You write React, but only with `@forge/react` components
  (`Text`, `Heading`, `Lozenge`, `ProgressBar`, `DynamicTable`, `Inline`, `Stack`…).
  **No HTML tags or CSS.** In return, the app looks like native Jira.
- **Backend (resolver)**: runs on Atlassian's servers. This is the only place that talks to the
  Jira API. The frontend calls it with `invoke()`.
- **Logic (`src/lib/health.js`)**: plain JavaScript functions with no Forge imports, which take issues and return
  flags and a score. Keeping it separate makes it easy to test and explain.

---

## 3. Where the data comes from

One JQL search gets every issue in the active sprint:

```
project = <KEY> AND sprint in openSprints()
```

- Endpoint: `POST /rest/api/3/search/jql`. **Not** the old `/rest/api/3/search`, which is deprecated.
- The project key comes from the page context (`useProductContext()`), so it isn't hard-coded.
  Our test space key is **BT**.

| Need | Jira field |
|---|---|
| Done / in progress / to do | `status.statusCategory.key` → `done` / `indeterminate` / `new` |
| Owner | `assignee` (null = unassigned) |
| Estimate | Story points custom field. **Its ID differs between sites**: look it up by name through `GET /rest/api/3/field` (usually "Story point estimate" in team-managed spaces, "Story Points" in company-managed) |
| Time in current status | `statuscategorychangedate` |
| Sprint name / end date | Sprint custom field (usually `customfield_10020`) |

We use the status **category**, not the status name, so renaming "In Progress" won't break the app.

---

## 4. Planned folder structure

```
health-check/
├── README.md               ← this file
├── manifest.yml            ← modules + permissions
├── package.json
└── src/
    ├── index.js            ← exports the resolver handler
    ├── resolvers/
    │   └── index.js        ← getSprintHealth: fetch issues, call lib, return result
    ├── lib/
    │   └── health.js       ← pure logic: flags, progress, score
    └── frontend/
        └── index.jsx       ← the Sprint Health panel (UI Kit)
```

The app only asks for read access:

```yaml
permissions:
  scopes:
    - read:jira-work
```

---

## 5. Scripts

Run these from the `health-check/` folder.

### npm scripts

| Command | What it does |
|---|---|
| `npm install` | Installs dependencies into `node_modules/` |
| `npm run lint` | Checks `src/` for mistakes with ESLint (rules in `.eslintrc`). No output means no problems. |
| `npm test` | Runs the unit tests with Node's built-in test runner (`node --test`), which finds every `*.test.js` file |

### Forge commands

| Command | When to use it |
|---|---|
| `forge tunnel` | While coding: code changes show up after a browser refresh, with no deploy |
| `forge deploy` | After changing `manifest.yml`, or to update the deployed version |
| `forge install --upgrade` | After adding a scope, so the site gets the new permissions |
| `forge lint` | Checks the manifest for mistakes before deploying |
| `forge logs` | Shows logs from the deployed app (with the tunnel running, logs print in the tunnel terminal instead) |

Adding a scope or module makes a new major version, so deploy with
`forge deploy --approve MAJOR_VERSION_RULE`, then run `forge install --upgrade`.
