import React from "react";
import { Heading, Text, Stack, Box } from "@forge/react";
import { cardStyle } from "./styles";
import { FLAG_ORDER, flagStyle } from "./flags";

const AttentionCard = ({ flagged, breakdown }) => (
  <Box xcss={cardStyle}>
    <Stack space="space.150">
      <Text weight="medium" color="color.text.subtle">
        Needs attention
      </Text>
      <Heading as="h3">
        {flagged.length} {flagged.length === 1 ? "issue" : "issues"}
      </Heading>
      <Stack space="space.025">
        {FLAG_ORDER.map((flag) => (
          <Text key={flag} size="small" color="color.text.subtlest">
            {breakdown[flag]} {flagStyle(flag).label.toLowerCase()}
          </Text>
        ))}
      </Stack>
    </Stack>
  </Box>
);

export default AttentionCard;
