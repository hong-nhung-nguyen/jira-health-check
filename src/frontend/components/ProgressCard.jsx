import React from "react";
import { Text, Lozenge, Badge, Inline, Stack, Box, xcss } from "@forge/react";
import { cardStyle } from "./styles";

const trackStyle = xcss({
  display: "flex",
  width: "100%",
  height: "8px",
  borderRadius: "border.radius.200",
  overflow: "hidden",
});

const segmentStyle = (color, count) =>
  xcss({ flexGrow: count, height: "8px", backgroundColor: color });

const percentOf = (count, total) => (total > 0 ? (count / total) * 100 : 0);

const ProgressCard = ({ progress }) => {
  const { total, done, inProgress, todo, points, percentDone } = progress;

  return (
    <Box xcss={cardStyle}>
      <Stack space="space.150">
        <Text weight="medium" color="color.text.subtle">
          Progress
        </Text>

        <Box xcss={trackStyle}>
          <Inline space="space.0" grow="fill">
            {done > 0 && (
              <Box xcss={segmentStyle("color.background.success.bold", done)} />
            )}
            {inProgress > 0 && (
              <Box
                xcss={segmentStyle(
                  "color.background.information.bold",
                  inProgress,
                )}
              />
            )}
            {todo > 0 && (
              <Box xcss={segmentStyle("color.background.neutral", todo)} />
            )}
          </Inline>
        </Box>

        <Inline space="space.100" alignBlock="center" shouldWrap>
          <Inline space="space.050" alignBlock="center">
            <Lozenge appearance="success">Done</Lozenge>
            <Badge appearance="added">{done}</Badge>
          </Inline>

          <Inline space="space.050" alignBlock="center">
            <Lozenge appearance="inprogress">In progress</Lozenge>
            <Badge appearance="primary">{inProgress}</Badge>
          </Inline>

          <Inline space="space.050" alignBlock="center">
            <Lozenge>To do</Lozenge>
            <Badge>{todo}</Badge>
          </Inline>
        </Inline>

        <Stack space="space.025">
          <Text size="small">
            {done} of {total} issues done
          </Text>
          {points.total > 0 && (
            <Text size="small" color="color.text.subtlest">
              {points.done} of {points.total} points ({percentDone}%)
            </Text>
          )}
        </Stack>
      </Stack>
    </Box>
  );
};

export default ProgressCard;
