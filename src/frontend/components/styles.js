import { xcss } from "@forge/react";

// add padding when removing Jira's page padding
export const pageStyle = xcss({ padding: "space.300" });

// Bordered card
export const cardStyle = xcss({
  flexGrow: 1, // cards share the leftover space
  minWidth: "240px", // below this, a card wraps to the next line
  padding: "space.200",
  borderColor: "color.border",
  borderWidth: "border.width",
  borderStyle: "solid",
  borderRadius: "radius.large",
  backgroundColor: "elevation.surface",
});

// Small vertical padding inside table cells
export const cellStyle = xcss({
  minHeight: "40px",
  paddingBlock: "space.050",
});
