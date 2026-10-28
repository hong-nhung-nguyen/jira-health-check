import { xcss } from "@forge/react";

// add padding when removing Jira's page padding
export const pageStyle = xcss({ padding: "space.300" });

// Bordered card
export const cardStyle = xcss({
  flexGrow: 1, // cards share the leftover space
  flexBasis: "0%", // start from 0, so they end up the same width
  minWidth: "240px", // below this, a card wraps to the next line
  padding: "space.200",
  borderColor: "color.border",
  borderWidth: "border.width",
  borderStyle: "solid",
  borderRadius: "border.radius.200",
  backgroundColor: "elevation.surface",
});

// Small vertical padding inside table cells
export const cellStyle = xcss({
  display: "flex",
  alignItems: "center",
  minHeight: "40px",
  paddingBlock: "space.050",
});
