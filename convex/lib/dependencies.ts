export const PERMIT_GRAPH_EDGES = [
  { fromNodeKey: "property", toNodeKey: "zoning", relationship: "requires" },
  { fromNodeKey: "zoning", toNodeKey: "setback", relationship: "requires" },
  { fromNodeKey: "zoning", toNodeKey: "height", relationship: "requires" },
  { fromNodeKey: "zoning", toNodeKey: "parking", relationship: "requires" },
  { fromNodeKey: "setback", toNodeKey: "site_plan", relationship: "requires" },
  { fromNodeKey: "height", toNodeKey: "site_plan", relationship: "requires" },
  { fromNodeKey: "site_plan", toNodeKey: "permit", relationship: "requires" },
  { fromNodeKey: "permit", toNodeKey: "structural", relationship: "requires" },
  { fromNodeKey: "structural", toNodeKey: "plan_check", relationship: "requires" },
] as const;
