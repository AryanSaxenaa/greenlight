export interface DocumentFact {
  label: string;
  value: string;
  confidence: number;
}

const FACT_PATTERNS: Array<{
  label: string;
  pattern: RegExp;
  confidence: number;
}> = [
  { label: "Lot area", pattern: /lot(?:\s+area)?[:\s]+([0-9,]+(?:\.\d+)?\s*(?:sq\.?\s*ft|sf))/i, confidence: 0.85 },
  { label: "Rear setback", pattern: /rear setback[:\s]+([0-9]+(?:\.\d+)?\s*(?:ft|feet|'))/i, confidence: 0.9 },
  { label: "Building height", pattern: /(?:proposed\s+)?height[:\s]+([0-9]+(?:\.\d+)?\s*(?:ft|feet|'))/i, confidence: 0.9 },
  { label: "Existing structure", pattern: /existing (?:structure|building|garage)[:\s]+([^\n.;]{3,100})/i, confidence: 0.75 },
  { label: "Proposed ADU", pattern: /proposed (?:adu|dwelling|unit)[:\s]+([^\n.;]{3,100})/i, confidence: 0.8 },
  { label: "Zoning", pattern: /zoning[:\s]+([A-Z0-9-]{2,12})/i, confidence: 0.8 },
];

export function extractFactsFromText(
  text: string,
  documentType: string,
  filename: string,
): DocumentFact[] {
  const combined = `${filename}\n${text}`;
  const facts: DocumentFact[] = [
    { label: "Document type", value: documentType, confidence: 1 },
    { label: "Filename", value: filename, confidence: 1 },
  ];

  for (const rule of FACT_PATTERNS) {
    const match = combined.match(rule.pattern);
    if (match?.[1]) {
      facts.push({
        label: rule.label,
        value: match[1].trim(),
        confidence: rule.confidence,
      });
    }
  }

  if (facts.length === 2 && documentType === "site_plan") {
    facts.push({
      label: "Evidence note",
      value: "Site plan uploaded for plan-check review.",
      confidence: 0.6,
    });
  }

  return facts;
}

export function requirementNodeKeysForDocumentType(documentType: string): string[] {
  switch (documentType) {
    case "site_plan":
      return ["site_plan"];
    case "structural":
      return ["structural"];
    case "survey":
      return ["property", "site_plan"];
    case "title_report":
      return ["property", "zoning"];
    case "existing_plans":
      return ["property", "site_plan"];
    default:
      return [];
  }
}
