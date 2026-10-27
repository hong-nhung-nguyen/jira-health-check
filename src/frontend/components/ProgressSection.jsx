import React from "react";
import { Heading, Text, Stack } from "@forge/react";

const ProgressSection = ({ progress }) => (
  <Stack space="space.100">
    <Heading as="h3">Progress</Heading>
    <Text>{progress.percentDone}% done</Text>
  </Stack>
);

export default ProgressSection;
