export interface ExtractedRequirement {
  nodeKey: string;
  title: string;
  category: string;
  status: "verified" | "blocked" | "review" | "missing" | "locked";
  verificationStatus: "known" | "unverified" | "unknown" | "conflicted";
  authority: string;
  evidenceRequired?: string;
  blockedReason?: string;
  sortOrder: number;
  isPrimaryBlocker: boolean;
  sourceKey?: string;
  sourceExcerpt?: string;
}

const RULE_PATTERNS: Array<{
  pattern: RegExp;
  build: (match: RegExpMatchArray) => ExtractedRequirement;
}> = [
  {
    pattern: /rear setback[^.\n]{0,160}/i,
    build: (match) => ({
      nodeKey: "setback",
      title: "Rear setback applicability",
      category: "setback",
      status: "blocked",
      verificationStatus: "known",
      authority: "City Planning",
      blockedReason: "Official ADU guidance references rear setback rules for this lot.",
      sourceExcerpt: match[0].trim(),
      sortOrder: 3,
      isPrimaryBlocker: true,
      sourceKey: "planning_adu",
    }),
  },
  {
    pattern: /(?:maximum|max)?\s*height[^.\n]{0,80}(\d+\s*(?:feet|ft|'))/i,
    build: (match) => ({
      nodeKey: "height",
      title: "Building height limit",
      category: "height",
      status: "review",
      verificationStatus: "known",
      authority: "City Planning",
      sourceExcerpt: match[0].trim(),
      sortOrder: 4,
      isPrimaryBlocker: false,
      sourceKey: "planning_adu",
    }),
  },
  {
    pattern: /parking[^.\n]{0,160}/i,
    build: (match) => ({
      nodeKey: "parking",
      title: "Parking requirement",
      category: "parking",
      status: "review",
      verificationStatus: "known",
      authority: "City Planning",
      sourceExcerpt: match[0].trim(),
      sortOrder: 5,
      isPrimaryBlocker: false,
      sourceKey: "planning_adu",
    }),
  },
  {
    pattern: /site plan|plot plan|scaled plan/i,
    build: () => ({
      nodeKey: "site_plan",
      title: "Site plan",
      category: "site_plan",
      status: "missing",
      verificationStatus: "known",
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
      nodeKey: "structural",
      title: "Structural calculations",
      category: "structural",
      status: "missing",
      verificationStatus: "known",
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

    const dedupeKey = requirement.nodeKey;
    if (seen.has(dedupeKey)) {
      continue;
    }
    seen.add(dedupeKey);

    extracted.push(requirement);
  }

  return extracted;
}

export function baseRequirements(): ExtractedRequirement[] {
  return [
    {
      nodeKey: "property",
      title: "Property identity",
      category: "property",
      status: "review",
      verificationStatus: "unknown",
      authority: "LADBS",
      blockedReason: "Awaiting authoritative parcel confirmation from official lookup.",
      sortOrder: 1,
      isPrimaryBlocker: false,
      sourceKey: "ladbs_property",
    },
    {
      nodeKey: "zoning",
      title: "Zoning designation",
      category: "zoning",
      status: "review",
      verificationStatus: "unknown",
      authority: "City Planning",
      blockedReason: "Awaiting ZIMAS zoning lookup for this parcel.",
      sortOrder: 2,
      isPrimaryBlocker: false,
      sourceKey: "zimas",
    },
    {
      nodeKey: "permit",
      title: "Building permit application",
      category: "permit",
      status: "locked",
      verificationStatus: "unverified",
      authority: "LADBS",
      blockedReason: "Unlocks after open plan-check requirements are satisfied.",
      sortOrder: 8,
      isPrimaryBlocker: false,
      sourceKey: "ladbs_adu",
    },
    {
      nodeKey: "plan_check",
      title: "Plan check",
      category: "plan_check",
      status: "locked",
      verificationStatus: "unverified",
      authority: "LADBS",
      blockedReason: "Unlocks after structural and site plan requirements are satisfied.",
      sortOrder: 9,
      isPrimaryBlocker: false,
      sourceKey: "ladbs_adu",
    },
  ];
}

export function dedupeRequirements(rows: ExtractedRequirement[]): ExtractedRequirement[] {
  const seen = new Set<string>();
  const deduped: ExtractedRequirement[] = [];

  for (const row of rows.sort((left, right) => left.sortOrder - right.sortOrder)) {
    if (seen.has(row.nodeKey)) {
      continue;
    }
    seen.add(row.nodeKey);
    deduped.push(row);
  }

  if (!deduped.some((row) => row.isPrimaryBlocker)) {
    const setback = deduped.find((row) => row.nodeKey === "setback");
    if (setback) {
      setback.isPrimaryBlocker = true;
      setback.status = "blocked";
    }
  }

  return deduped;
}
