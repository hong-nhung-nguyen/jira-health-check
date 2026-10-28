import React from "react";
import { Heading, Text, Lozenge, Inline, Stack } from "@forge/react";
import { DEFAULT_CONFIG } from "../../lib/config";

const STATUS_STYLE = {
  green: { appearance: "success", label: "Healthy" },
  amber: { appearance: "moved", label: "At risk" },
  red: { appearance: "removed", label: "Unhealthy" },
};

const FLAG_LABELS = {
  stuck: "stuck",
  unassigned: "unassigned",
  unestimated: "unestimated",
};

// "−20 unassigned (2) . −10 unestimated (2)", only for flag types that are present
const describeBreakdown = (breakdown, penalty) =>
  Object.keys(FLAG_LABELS)
    .filter((flag) => breakdown[flag] > 0)
    .map(
      (flag) =>
        `-${breakdown[flag] * penalty[flag]} ${FLAG_LABELS[flag]} (${breakdown[flag]})`,
    )
    .join(" . ");

const ScoreHeader = ({
  sprint,
  score,
  status,
  breakdown,
  config = DEFAULT_CONFIG,
}) => {
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.red;
  const explanation = describeBreakdown(breakdown, config.PENALTY);

  return (
    <Stack space="space.100">
      <Inline spread="space-between" alignBlock="center">
        <Heading as="h2">{sprint?.name ?? "Active sprint"}</Heading>
        {sprint?.daysLeft != null && (
          <Text>
            {sprint.daysLeft} {sprint.daysLeft === 1 ? "day" : "days"} left
          </Text>
        )}
      </Inline>

      <Inline space="space.150" alignBlock="center">
        <Heading as="h1">{score} / 100</Heading>
        <Lozenge appearance={style.appearance} isBold>
          {style.label}
        </Lozenge>
      </Inline>

      <Text>{explanation || "No issues need attention."}</Text>
    </Stack>
  );
};

export default ScoreHeader;
