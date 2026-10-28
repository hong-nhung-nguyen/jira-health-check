import React from "react";
import {
  Heading,
  Text,
  Link,
  Lozenge,
  Inline,
  DynamicTable,
  Box,
  xcss,
  Stack,
} from "@forge/react";

// Extra vertical space in each cell (space.100 = 8px)
const cellStyle = xcss({ passingBlock: "space.100" });
const Cell = ({ children }) => <Box xcss={cellStyle}>{children}</Box>;

const FLAG_STYLE = {
  stuck: { appearance: "removed", label: "Stuck" },
  unassigned: { appearance: "moved", label: "Unassigned" },
  unestimated: { appearance: "default", label: "Unestimate" },
};

const MAX_SUMMARY = 60;
const truncate = (text) =>
  text.length > MAX_SUMMARY ? `${text.slice(0, MAX_SUMMARY - 1)}...` : text;

const head = {
  cells: [
    { key: "key", content: "Key" },
    { key: "summary", content: "Summary" },
    { key: "flags", content: "Flags" },
    { key: "assignee", content: "Assignee" },
    { key: "days", content: "Days in status" },
  ],
};

const toRow = (issue) => ({
  key: issue.key,
  cells: [
    {
      key: "key",
      content: (
        <Cell>
          <Link href={issue.url} openNewTab>
            {issue.key}
          </Link>
        </Cell>
      ),
    },
    { key: "summary", content: <Cell>truncate(issue.summary)</Cell> },
    {
      key: "flags",
      content: (
        <Cell>
          <Inline space="space.050">
            {issue.flags.map((flag) => (
              <Lozenge key={flag} appearance={FLAG_STYLE[flag].appearance}>
                {FLAG_STYLE[flag].label}
              </Lozenge>
            ))}
          </Inline>
        </Cell>
      ),
    },
    {
      key: "assignee",
      content: <Cell>{issue.assignee ?? <Text as="em">Unassigned</Text>}</Cell>,
    },
    {
      key: "days",
      // only meaningful for in-progress work
      content: (
        <Cell>
          {issue.statusCategory === "indeterminate" &&
          issue.daysInStatus != null
            ? String(issue.daysInStatus)
            : "-"}
        </Cell>
      ),
    },
  ],
});

const NeedsAttention = ({ flagged }) => (
  <Stack space="space.100">
    <Heading as="h3">Needs attention ({flagged.length})</Heading>
    <DynamicTable head={head} rows={flagged.map(toRow)} rowsPerPage={10} />
  </Stack>
);

export default NeedsAttention;
