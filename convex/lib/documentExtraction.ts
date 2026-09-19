export interface DocumentFact {
  label: string;
  value: string;
}

const FACT_PATTERNS: Array<{
  label: string;
  pattern: RegExp;
}> = [
  { label: "Lot area", pattern: /lot(?:\s+area)?[:\s]+([0-9,]+(?:\.\d+)?\s*(?:sq\.?\s*ft|sf))/i },
  { label: "Rear setback", pattern: /rear setback[:\s]+([0-9]+(?:\.\d+)?\s*(?:ft|feet|'))/i },
  { label: "Building height", pattern: /height[:\s]+([0-9]+(?:\.\d+)?\s*(?:ft|feet|'))/i },
  { label: "Existing structure", pattern: /existing (?:structure|building)[:\s]+([^\n.;]{3,80})/i },
  { label: "Proposed ADU", pattern: /proposed (?:adu|dwelling)[:\s]+([^\n.;]{3,80})/i },
];

export function extractFactsFromText(
  text: string,
  documentType: string,
): DocumentFact[] {
  const facts: DocumentFact[] = [
    { label: "Document type", value: documentType },
  ];

  for (const rule of FACT_PATTERNS) {
    const match = text.match(rule.pattern);
    if (match?.[1]) {
      facts.push({ label: rule.label, value: match[1].trim() });
    }
  }

  if (facts.length === 1 && documentType === "site_plan") {
    facts.push({
      label: "Evidence note",
      value: "Site plan uploaded for plan-check review.",
    });
  }

  return facts;
}

export function requirementCategoriesForDocumentType(
  documentType: string,
): string[] {
  switch (documentType) {
    case "site_plan":
      return ["site_plan"];
    case "structural":
      return ["structural"];
    case "title_report":
      return ["property", "zoning"];
    default:
      return [];
  }
}
