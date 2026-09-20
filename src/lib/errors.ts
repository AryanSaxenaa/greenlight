export function formatConvexError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("InvalidAccountId")) {
    return "No account found with that email.";
  }

  if (message.includes("InvalidSecret")) {
    return "Incorrect password.";
  }

  if (message.includes("Not authenticated")) {
    return "Please sign in to continue.";
  }

  if (message.includes("Unauthorized")) {
    return "You do not have access to this project.";
  }

  const uncaughtMatch = message.match(
    /Uncaught Error: ([^\n]+?)(?:\s+at\s|\s+Called by client|$)/,
  );
  if (uncaughtMatch?.[1]) {
    return uncaughtMatch[1].trim();
  }

  const cleaned = message
    .replace(/\[CONVEX[^\]]*\]\s*/g, "")
    .replace(/\[Request ID:[^\]]*\]\s*/g, "")
    .replace(/Server Error\s*/g, "")
    .trim();

  return cleaned || "Something went wrong. Please try again.";
}

export function isConvexId(value: string | undefined): boolean {
  return typeof value === "string" && /^[a-z0-9]{32}$/.test(value);
}
