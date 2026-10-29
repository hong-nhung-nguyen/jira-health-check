import React, { useState } from "react";
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
  Button,
  EmptyState,
  Badge,
} from "@forge/react";
import FixIssueModal from "./FixIssueModal";
import { cellStyle } from "./styles";
import { flagStyle } from "./flags";

const FIXABLE = ["unassigned", "unestimated"];

const MAX_SUMMARY = 60;
const truncate = (text) =>
  text.length > MAX_SUMMARY ? `${text.slice(0, MAX_SUMMARY - 1)}...` : text;

const Cell = ({ children, center = false }) => (
  <Box xcss={cellStyle}>
    <Inline alignBlock="center" alignInline={center ? "center" : "start"}>
      {children}
    </Inline>
  </Box>
);

const head = {
  cells: [
    // width = % of the table; adds up to 100
    { key: "key", content: "Key", width: 7 },
    { key: "summary", content: "Summary", width: 30 },
    { key: "flags", content: "Flags", width: 14 }, // just fits [Unassigned] [No estimate]
    { key: "assignee", content: "Assignee", width: 15 },
    { key: "points", content: "Story point estimate", width: 13 },
    { key: "days", content: "Days in status", width: 12 },
    { key: "actions", content: "Actions", width: 9 },
  ],
};

const toRow = (issue, onFix) => ({
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
          <Inline space="space.050">
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
      key: "points",
      content: (
        <Cell>
          <Text>{issue.points ?? "-"}</Text>
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
    {
      key: "actions",
      content: (
        <Cell>
          {issue.flags.some((f) => FIXABLE.includes(f)) && (
            <Button appearance="subtle" onClick={() => onFix(issue)}>
              Fix
            </Button>
          )}
        </Cell>
      ),
    },
  ],
});

const NeedsAttention = ({ flagged, onChanged }) => {
  const [editing, setEditing] = useState(null);

  const handleSaved = () => {
    setEditing(null);
    onChanged();
  };
  return (
    <Stack space="space.150">
      <Inline>
        <Heading size="medium">Needs attention</Heading>
      </Inline>
      {flagged.length === 0 ? (
        <EmptyState
          header="All clear 🎉"
          description="No issue need attention in this sprint."
        />
      ) : (
        <DynamicTable
          head={head}
          rows={flagged.map((issue) => toRow(issue, setEditing))}
          rowsPerPage={10}
        />
      )}
      {editing && (
        <FixIssueModal
          issue={editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </Stack>
  );
};

export default NeedsAttention;
