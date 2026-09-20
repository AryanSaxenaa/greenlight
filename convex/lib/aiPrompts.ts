export function buildRequirementsExtractionPrompt(args: {
  projectIntent: string;
  address: string;
  sources: Array<{ key: string; label: string; url: string; markdown: string }>;
}) {
  const sourceBlocks = args.sources
    .map(
      (source) =>
        `SOURCE KEY: ${source.key}\nTITLE: ${source.label}\nURL: ${source.url}\nCONTENT:\n${source.markdown}`,
    )
    .join("\n\n---\n\n");

  return [
    "You extract Los Angeles residential ADU permit requirements from official government source text.",
    "Return only requirements supported by the provided source excerpts.",
    "Use nodeKey values from this set when applicable: property, zoning, setback, height, parking, site_plan, structural, permit, plan_check.",
    "Mark exactly one primary blocker when a setback or zoning issue blocks progress.",
    "Do not invent parcel data, fees, or agency contacts.",
    "",
    `PROJECT INTENT: ${args.projectIntent}`,
    `PROPERTY ADDRESS: ${args.address}`,
    "",
    sourceBlocks,
  ].join("\n");
}

export function buildInboundEmailPrompt(args: {
  subject: string;
  body: string;
  requirements: Array<{ nodeKey: string; title: string; category: string }>;
}) {
  const requirementList = args.requirements
    .map((item) => `- ${item.nodeKey}: ${item.title} (${item.category})`)
    .join("\n");

  return [
    "You parse inbound Los Angeles planning or building department email for a residential permit project.",
    "Extract classification, agency decision, project impact, and any action required.",
    "Link to a requirement nodeKey only when clearly supported by the message.",
    "",
    "KNOWN REQUIREMENTS:",
    requirementList,
    "",
    `SUBJECT: ${args.subject}`,
    "",
    "BODY:",
    args.body,
  ].join("\n");
}

export function buildClarificationDraftPrompt(args: {
  projectIntent: string;
  address: string;
  jurisdiction: string;
  requirementTitle: string;
  requirementReason: string;
  sourceExcerpt?: string;
  parameters: Array<{ key: string; value: string; unit?: string }>;
  recipientEmail: string;
}) {
  const parameterLines = args.parameters
    .map((parameter) => `- ${parameter.key}: ${parameter.value}${parameter.unit ? ` ${parameter.unit}` : ""}`)
    .join("\n");

  return [
    "Draft a professional clarification email to a Los Angeles planning or building agency.",
    "Use only the project facts provided. Do not invent dimensions, approvals, or citations.",
    "Keep the tone concise and factual. Include a PROJECT FACTS USED section in the body.",
    "",
    `RECIPIENT: ${args.recipientEmail}`,
    `PROJECT INTENT: ${args.projectIntent}`,
    `PROPERTY: ${args.address}`,
    `JURISDICTION: ${args.jurisdiction}`,
    `REQUIREMENT: ${args.requirementTitle}`,
    `WHY CLARIFICATION IS NEEDED: ${args.requirementReason}`,
    args.sourceExcerpt ? `SOURCE EXCERPT: ${args.sourceExcerpt}` : "",
    "",
    "PROJECT PARAMETERS:",
    parameterLines,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildDocumentFactsPrompt(args: {
  filename: string;
  documentType: string;
  text: string;
}) {
  return [
    "Extract structured permit-relevant facts from this uploaded project document.",
    "Prefer lot area, setbacks, height, zoning, existing structure, and proposed ADU details when present.",
    "Do not invent values that are not supported by the text.",
    "",
    `FILENAME: ${args.filename}`,
    `DOCUMENT TYPE: ${args.documentType}`,
    "",
    "DOCUMENT TEXT:",
    args.text.slice(0, 6000),
  ].join("\n");
}
