// Page Header
import React from "react";
import { Heading, Text, Stack } from "@forge/react";

// e.g. Thu 29 Oct
const formatDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

const describeDates = (sprint) => {
  if (!sprint?.endDate) return null;
  const left =
    sprint.daysLeft === 1 ? "1 day left" : `${sprint.daysLeft} days left`;
  return `Ends ${formatDate(sprint.endDate)} . ${left}`;
};

const SprintHeader = ({ sprint }) => {
  const subtitle = describeDates(sprint);
  return (
    <Stack space="space.050">
      <Heading>{sprint?.name ?? "Active sprint"}</Heading>
      {subtitle && <Text color="color.text.subtlest">{subtitle}</Text>}
    </Stack>
  );
};

export default SprintHeader;
