export interface ExtractedRequirement {
  title: string;
  category: string;
  status: "verified" | "blocked" | "review" | "missing" | "locked";
  authority: string;
  evidenceRequired?: string;
  blockedReason?: string;
  sortOrder: number;
  isPrimaryBlocker: boolean;
  sourceKey?: string;
  excerpt?: string;
}

const RULE_PATTERNS: Array<{
  pattern: RegExp;
  build: (match: RegExpMatchArray) => ExtractedRequirement;
}> = [
  {
    pattern: /rear setback[^.\n]{0,120}/i,
    build: () => ({
      title: "Rear setback applicability",
      category: "setback",
      status: "blocked",
      authority: "City Planning",
      blockedReason:
        "Official ADU guidance references rear setback rules that must be confirmed for this lot.",
      sortOrder: 3,
      isPrimaryBlocker: true,
      sourceKey: "planning_adu",
    }),
  },
  {
    pattern: /height[^.\n]{0,80}(\d+\s*(?:feet|ft|'))/i,
    build: (match) => ({
      title: "Building height limit",
      category: "height",
      status: "verified",
      authority: "City Planning",
      blockedReason: `Source excerpt: ${match[0].trim()}`,
      sortOrder: 4,
      isPrimaryBlocker: false,
      sourceKey: "planning_adu",
    }),
  },
  {
    pattern: /parking[^.\n]{0,120}/i,
    build: (match) => ({
      title: "Parking requirement",
      category: "parking",
      status: "review",
      authority: "City Planning",
      blockedReason: `Source excerpt: ${match[0].trim()}`,
      sortOrder: 5,
      isPrimaryBlocker: false,
      sourceKey: "planning_adu",
    }),
  },
  {
    pattern: /site plan|plot plan|scaled plan/i,
    build: () => ({
      title: "Site plan",
      category: "site_plan",
      status: "missing",
      authority: "LADBS Plan Check",
      evidenceRequired: "Scaled site plan with existing and proposed structures",
      sortOrder: 6,
      isPrimaryBlocker: false,
      sourceKey: "ladbs_adu",
    }),
  },
  {
    pattern: /structural|engineering calcs|load[- ]bearing/i,
    build: () => ({
      title: "Structural calculations",
      category: "structural",
      status: "missing",
      authority: "LADBS",
      evidenceRequired: "Engineering calcs for new or modified load-bearing elements",
      sortOrder: 7,
      isPrimaryBlocker: false,
      sourceKey: "ladbs_adu",
    }),
  },
];

export function extractRequirementsFromMarkdown(
  markdown: string,
  sourceKey: string,
): ExtractedRequirement[] {
  const extracted: ExtractedRequirement[] = [];
  const seen = new Set<string>();

  for (const rule of RULE_PATTERNS) {
    const match = markdown.match(rule.pattern);
    if (!match) {
      continue;
    }

    const requirement = rule.build(match);
    if (requirement.sourceKey && requirement.sourceKey !== sourceKey) {
      continue;
    }

    const dedupeKey = `${requirement.category}:${requirement.title}`;
    if (seen.has(dedupeKey)) {
      continue;
    }
    seen.add(dedupeKey);

    extracted.push({
      ...requirement,
      excerpt: match[0].trim(),
    });
  }

  return extracted;
}

export function baseRequirements(): ExtractedRequirement[] {
  return [
    {
      title: "Property identity",
      category: "property",
      status: "verified",
      authority: "City of Los Angeles",
      sortOrder: 1,
      isPrimaryBlocker: false,
      sourceKey: "ladbs_property",
    },
    {
      title: "Zoning designation",
      category: "zoning",
      status: "verified",
      authority: "City Planning",
      sortOrder: 2,
      isPrimaryBlocker: false,
      sourceKey: "zimas",
    },
    {
      title: "Building permit application",
      category: "permit",
      status: "locked",
      authority: "LADBS",
      blockedReason: "Unlocks after open plan-check requirements are satisfied.",
      sortOrder: 8,
      isPrimaryBlocker: false,
      sourceKey: "ladbs_adu",
    },
  ];
}
