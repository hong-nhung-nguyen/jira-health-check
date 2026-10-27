import React from "react";
import { Heading, Text, Stack } from "@forge/react";

const ScoreHeader = ({ sprint, score, status }) => (
  <Stack space="space.100">
    <Heading as="h2">{sprint ? sprint.name : "Sprint Health"}</Heading>
    <Text>
      Score: {score} / 100 ({status})
    </Text>
  </Stack>
);

export default ScoreHeader;
