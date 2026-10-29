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
  xcss,
} from "@forge/react";
import FixIssueModal from "./FixIssueModal";
import { cellStyle } from "./styles";
import { FLAG_ORDER, flagStyle } from "./flags";

const FIXABLE = ["unassigned", "unestimated"];

// small status dot in front of the heading
const dotStyle = (color) =>
  xcss({
    width: "8px",
    height: "8px",
    borderRadius: "radius.full",
    backgroundColor: color,
  });

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

const TableHeader = ({ total, counts, filter, onFilter }) => {
  const dotColor =
    counts.stuck > 0 ? "color.icon.danger" : "color.icon.warning";

  return (
    <Inline
      spread="space-between"
      alignBlock="center"
      shoudlWrap
      space="space.100"
    >
      <Inline space="space.100" alignBlock="center">
        <Box xcss={dotStyle(dotColor)} />
        <Heading size="medium">Needs attention</Heading>
        <Badge>{total}</Badge>
      </Inline>

      <Inline space="space.075" alignBlock="center">
        <Button
          spacing="compact"
          appearance={filter === "all" ? "primary" : "default"}
          onClick={() => onFilter("all")}
        >
          All ({total})
        </Button>
        {FLAG_ORDER.filter((flag) => counts[flag] > 0).map((flag) => (
          <Button
            key={flag}
            spacing="compact"
            appearance={filter === flag ? "primary" : "default"}
            onClick={() => onFilter(flag)}
          >
            {flagStyle(flag).label} ({counts[flag]})
          </Button>
        ))}
      </Inline>
    </Inline>
  );
};

const NeedsAttention = ({ flagged, onChanged }) => {
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState("all");

  // Issues per flag
  const counts = Object.fromEntries(
    FLAG_ORDER.map((flag) => [
      flag,
      flagged.filter((i) => i.flags.includes(flag)).length,
    ]),
  );

  // If a fix empties the current filter, fall back to All instead of showing an empty table
  const active = filter !== "all" && counts[filter] === 0 ? "all" : filter;
  const visible =
    active === "all"
      ? flagged
      : flagged.filter((i) => i.flags.includes(active));

  const handleSaved = () => {
    setEditing(null);
    onChanged();
  };

  return (
    <Stack space="space.200">
      {flagged.length === 0 ? (
        <>
          <Heading size="small">Needs attention</Heading>
          <EmptyState
            header="All clear 🎉"
            description="No issues need attention in this sprint."
          />
        </>
      ) : (
        <>
          <TableHeader
            total={flagged.length}
            counts={counts}
            filter={active}
            onFilter={setFilter}
          />
          <DynamicTable
            head={head}
            rows={visible.map((issue) => toRow(issue, setEditing))}
            rowsPerPage={10}
          />
        </>
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
