// How each flag from health.js looks, order = severity
export const FLAG_STYLE = {
  stuck: { appearance: "removed", label: "Stuck" },
  unassigned: { appearance: "moved", label: "Unassigned" },
  unestimated: { appearance: "default", label: "No estimate" },
};

export const FLAG_ORDER = ["stuck", "unassigned", "unestimated"];

// Unknown flag --> plain grey
export const flagStyle = (flag) =>
  FLAG_STYLE[flag] ?? { appearance: "default", label: flag };
