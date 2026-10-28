import React from "react";
import {
  Heading,
  Text,
  ProgressBar,
  Lozenge,
  Inline,
  Stack,
} from "@forge/react";

// Use points if the sprint has any, otherwise issue count
const describeProgress = ({ total, done, points, percentDone }) =>
  points.total > 0
    ? `${points.done} of ${points.total} points done (${percentDone}%)`
    : `${done} of ${total} issues done (${percentDone}%)`;

const ProgressSection = ({ progress }) => (
  <Stack space="space.100">
    <Heading as="h3">Progress</Heading>

    <ProgressBar
      value={progress.percentDone / 100}
      appearance={progress.percentDone === 100 ? "success" : "default"}
      ariaLabel={`Sprint ${progress.percentDone}% done`}
    />
    <Text>{describeProgress(progress)}</Text>

    <Inline space="space.100">
      <Lozenge appearance="new">To do {progress.todo}</Lozenge>
      <Lozenge appearance="inprogress">
        In progress {progress.inProgress}
      </Lozenge>
      <Lozenge appearance="success">Done {progress.done}</Lozenge>
    </Inline>
  </Stack>
);

export default ProgressSection;
