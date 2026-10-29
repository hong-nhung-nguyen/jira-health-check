import React from "react";
import { Heading, Text, Lozenge, Inline, Stack, Box } from "@forge/react";
import { cardStyle } from "./styles";
import { FLAG_ORDER, flagStyle } from "./flags";

const STATUS_STYLE = {
  green: { appearance: "success", label: "Healthy" },
  amber: { appearance: "moved", label: "At risk" },
  red: { appearance: "removed", label: "Unhealthy" },
};

const HealthCard = ({ score, status, breakdown }) => {
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.red;
  const present = FLAG_ORDER.filter((flag) => breakdown[flag] > 0);

  return (
    <Box xcss={cardStyle}>
      <Stack space="space.150">
        <Text weight="medium" color="color.text.subtle">
          Health
        </Text>

        <Inline space="space.100" alignBlock="center">
          <Heading size="medium">{score} / 100</Heading>
          <Lozenge appearance={style.appearance} isBold>
            {style.label}
          </Lozenge>
        </Inline>

        {present.length > 0 ? (
          <Stack space="space.075">
            <Inline space="space.050" shouldWrap>
              {present.map((flag) => (
                <Lozenge key={flag} appearance={flagStyle(flag).appearance}>
                  {breakdown[flag]} {flagStyle(flag).label}
                </Lozenge>
              ))}
            </Inline>
            <Text>-{100 - score} points</Text>
          </Stack>
        ) : (
          <Text size="small" color="color.text.subtlest">
            Nothing is lowering the score
          </Text>
        )}
      </Stack>
    </Box>
  );
};

export default HealthCard;
