export type RequirementStatus =
  | "verified"
  | "blocked"
  | "review"
  | "missing"
  | "locked";

export function statusLabel(status: RequirementStatus): string {
  switch (status) {
    case "verified":
      return "Verified";
    case "blocked":
      return "Blocked";
    case "review":
      return "Review";
    case "missing":
      return "Missing";
    case "locked":
      return "Locked";
  }
}

export function statusClass(status: RequirementStatus): string {
  return `status-pill status-${status}`;
}

export function projectStatusLabel(
  status: "draft" | "compiling" | "active" | "archived",
): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "compiling":
      return "Compiling";
    case "active":
      return "Active";
    case "archived":
      return "Archived";
  }
}

export function stageLabel(status: "waiting" | "running" | "complete"): string {
  switch (status) {
    case "waiting":
      return "Waiting";
    case "running":
      return "Running";
    case "complete":
      return "Complete";
  }
}
