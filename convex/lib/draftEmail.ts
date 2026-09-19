import type { Doc } from "../_generated/dataModel";

export function buildClarificationDraft(args: {
  project: Doc<"projects">;
  requirement: Doc<"requirements">;
  parameters: Array<Doc<"projectParameters">>;
  recipientEmail: string;
}) {
  const factsUsed = [
    `Property: ${args.project.normalizedAddress ?? args.project.address}`,
    `Jurisdiction: ${args.project.jurisdiction ?? "Pending"}`,
    `Project intent: ${args.project.intent}`,
    ...args.parameters.map(
      (parameter) => `${parameter.key}: ${parameter.value}${parameter.unit ? ` ${parameter.unit}` : ""}`,
    ),
    args.requirement.sourceExcerpt
      ? `Source excerpt: ${args.requirement.sourceExcerpt}`
      : undefined,
  ].filter((fact): fact is string => Boolean(fact));

  const body = [
    "Hello,",
    "",
    `We are preparing a residential ADU project at ${args.project.normalizedAddress ?? args.project.address} and need clarification on ${args.requirement.title.toLowerCase()}.`,
    "",
    "PROJECT FACTS USED",
    ...factsUsed.map((fact) => `- ${fact}`),
    "",
    "QUESTION",
    args.requirement.blockedReason ??
      args.requirement.sourceExcerpt ??
      "Please confirm the applicable requirement for this site.",
    "",
    "Thank you,",
    "Greenlight project team",
  ].join("\n");

  return {
    subject: `Clarification request: ${args.requirement.title}`,
    body,
    toAddresses: [args.recipientEmail],
    factsUsed,
  };
}
