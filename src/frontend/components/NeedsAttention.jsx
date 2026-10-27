import React from "react";
import { Heading, Text, Stack } from "@forge/react";

const NeedsAttention = ({ flagged }) => (
  <Stack space="space.100">
    <Heading>Needs attention ({flagged.length})</Heading>
    <Text>{flagged.map((i) => i.key).join(", ") || "Nothing flagged"}</Text>
  </Stack>
);

export default NeedsAttention;
