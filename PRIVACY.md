# Privacy

Sprint Health runs entirely on Atlassian Forge.

- It reads sprint issues (summary, status, assignee, story points, sprint) **as the viewing user**,
  so it only sees what that user can already see.
- It edits an issue (assignee or story points) **only** when a user clicks **Fix** and saves.
- It does **not** store any data: no Forge storage, no database, and nothing is sent outside
  Atlassian.
- Contact: open an issue at https://github.com/hong-nhung-nguyen/jira-health-check/issues
