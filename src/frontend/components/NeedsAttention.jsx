import React from "react";
import {
  Heading,
  Text,
  Link,
  Lozenge,
  Inline,
  Stack,
  Box,
  DynamicTable,
  User,
  EmptyState,
} from "@forge/react";
import { cellStyle } from "./styles";
import { flagStyle } from "./flags";

const MAX_SUMMARY = 60;
const truncate = (text) =>
  text.length > MAX_SUMMARY ? `${text.slice(0, MAX_SUMMARY - 1)}...` : text;

const Cell = ({ children }) => <Box xcss={cellStyle}>{children}</Box>;

const head = {
  cells: [
    { key: "key", content: "Key" },
    { key: "summar", content: "Summar" },
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
    {
      key: "summary",
      content: (
        <Cell>
          <Text>{truncate(issue.summary)}</Text>
        </Cell>
      ),
    },
    {
      key: "flags",
      content: (
        <Cell>
          <Inline space="space.050" shouldWrap>
            {issue.flags.map((flag) => (
              <Lozenge key={flag} appearance={flagStyle(flag).appearance}>
                {flagStyle(flag).label}
              </Lozenge>
            ))}
          </Inline>
        </Cell>
      ),
    },
    {
      key: "assignee",
      content: (
        <Cell>
          {issue.assigneeId ? (
            <User accountId={issue.assigneeId} />
          ) : (
            <Text color="color.text.subtlest">Unassigned</Text>
          )}
        </Cell>
      ),
    },
    {
      key: "days",
      content: (
        <Cell>
          <Text>
            {issue.statusCategory === "indeterminate" &&
            issue.daysInStatus != null
              ? String(issue.daysInStatus)
              : "-"}
          </Text>
        </Cell>
      ),
    },
  ],
});

const NeedsAttention = ({ flagged }) => (
  <Stack space="space.150">
    <Heading as="h3">Needs attention</Heading>
    {flagged.length === 0 ? (
      <EmptyState
        header="All clear 🎉"
        description="No issue need attention in this sprint."
      />
    ) : (
      <DynamicTable head={head} rows={flagged.map(toRow)} rowsPerPage={10} />
    )}
  </Stack>
);

export default NeedsAttention;
