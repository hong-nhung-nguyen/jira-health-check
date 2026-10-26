# Expected results: BT active sprint

The correct answers for the **Book Tracker (BT)** test sprint, counted by hand in Jira **before** writing any logic.
The unit tests (#19) and manual test pass (#30) compare the app's output against this file.

- **Counted on:** 26/10/2026
- **Sprint name:** BOOK Sprint 1
- **Sprint end date:** 29/10/2026

> Run every query in **Search → View all work items → JQL**. The count appears above the results.
> All queries are limited to the active sprint, because that's all the app looks at.

---

## 1. Progress

| Metric | JQL | Expected |
|---|---|---|
| Total issues | `project = BT AND sprint in openSprints()` | 20 |
| To do | `project = BT AND sprint in openSprints() AND statusCategory = "To Do"` | 8 |
| In progress | `project = BT AND sprint in openSprints() AND statusCategory = "In Progress"` | 1 |
| Done | `project = BT AND sprint in openSprints() AND statusCategory = Done` | 11 |
| Total points | Sum of the **Story point estimate** column for the "Total issues" query (List view) | 56 |
| Done points | Sum of **Story point estimate** for the "Done" query | 33 |
| % done (by points) | `round(Done points / Total points × 100)` | 59% |

---

## 2. Flags (only issues that are **not Done** are flagged)

| Flag | JQL | Count | Issue keys |
|---|---|---|---|
| Unassigned | `project = BT AND sprint in openSprints() AND statusCategory != Done AND assignee is EMPTY` | 2 | BT-14, BT-15 |
| Unestimated | `project = BT AND sprint in openSprints() AND statusCategory != Done AND "Story point estimate" is EMPTY` | 2 | BT-16, BT-17 |
| Stuck (`STUCK_DAYS = 0`) | `project = BT AND sprint in openSprints() AND statusCategory = "In Progress" AND statusCategoryChangedDate < startOfDay()` | 0 | |
| Stuck (`STUCK_DAYS = 3`) | `project = BT AND sprint in openSprints() AND statusCategory = "In Progress" AND statusCategoryChangedDate < startOfDay(-3d)` | 0 | |

Notes:
- An issue with **0** story points counts as estimated. Only an empty field counts as unestimated.
- One issue can appear in more than one row (e.g. unassigned **and** unestimated). Count it in each row.
- "Stuck" means in progress for **more than** `STUCK_DAYS` days, counted from `statusCategoryChangedDate`.
- **Stuck is 0 on 26 Oct** because the only In Progress item (BT-__) moved there that day. It becomes stuck at `STUCK_DAYS = 0` from **Tue 27 Oct** (1 day), and at `STUCK_DAYS = 3` only from **Fri 30 Oct** (4 days). Use `STUCK_DAYS = 0` for testing and the demo on Thu 29 Oct, and **don't change its status** this week, or the count restarts.
- **Expected on Thu 29 Oct with `STUCK_DAYS = 0`:** 1 stuck, so `100 − 15 − 20 − 10 = 55` → 🟡, and the stuck item moves to the top of the needs attention table.

---

## 3. Health score

Formula (from `src/lib/config.js`):

```
score = max(0, 100 − 15 × stuck − 10 × unassigned − 5 × unestimated)
🟢 green ≥ 80   🟡 amber 50–79   🔴 red < 50
```

### With `STUCK_DAYS = 3` (default)

```
100 − 15 × 0 (stuck) − 10 × 2 (unassigned) − 5 × 2 (unestimated)
= 70
```

**Expected score:** 70  **Expected status:** 🟡

### With `STUCK_DAYS = 0`

```
100 − 15 × 0 (stuck) − 10 × 2 (unassigned) − 5 × 2 (unestimated)
= 70
```

**Expected score:** 70  **Expected status:** 🟡

---

## 4. Needs attention table (expected order)

Worst first: stuck, then unassigned, then unestimated. Ties go to whichever has been in its status longest.
Items with the same flag that changed status on the same day (e.g. BT-14 and BT-15) can appear in either order.

| # | Key | Flags |
|---|---|---|
| 1 | BT-14 | Unassigned |
| 2 | BT-15 | Unassigned |
| 3 | BT-16 | Unestimated |
| 4 | BT-17 | Unestimated |

