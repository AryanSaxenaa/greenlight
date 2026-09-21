import type { ExtractedRequirement } from "./requirementExtraction";

const ALLOWED_STATUSES = new Set<ExtractedRequirement["status"]>([
  "verified",
  "blocked",
  "review",
  "missing",
  "locked",
]);

const STATUS_SYNONYMS: Record<string, ExtractedRequirement["status"]> = {
  verified: "verified",
  complete: "verified",
  completed: "verified",
  satisfied: "verified",
  approved: "verified",
  pass: "verified",
  blocked: "blocked",
  block: "blocked",
  blocker: "blocked",
  failed: "blocked",
  review: "review",
  pending: "review",
  required: "review",
  in_review: "review",
  needs_review: "review",
  open: "review",
  unknown: "review",
  missing: "missing",
  incomplete: "missing",
  not_provided: "missing",
  absent: "missing",
  locked: "locked",
  unavailable: "locked",
  disabled: "locked",
};

const ALLOWED_VERIFICATION = new Set<ExtractedRequirement["verificationStatus"]>([
  "known",
  "unverified",
  "unknown",
  "conflicted",
]);

const VERIFICATION_SYNONYMS: Record<string, ExtractedRequirement["verificationStatus"]> = {
  known: "known",
  verified: "known",
  confirmed: "known",
  unverified: "unverified",
  pending: "unverified",
  unknown: "unknown",
  conflicted: "conflicted",
  conflict: "conflicted",
  disputed: "conflicted",
};

const ALLOWED_NODE_KEYS = new Set([
  "property",
  "zoning",
  "setback",
  "height",
  "parking",
  "site_plan",
  "structural",
  "permit",
  "plan_check",
]);

function normalizeKey(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

export function normalizeRequirementStatus(
  value: unknown,
  fallback: ExtractedRequirement["status"] = "review",
): ExtractedRequirement["status"] {
  const key = normalizeKey(value);
  if (ALLOWED_STATUSES.has(key as ExtractedRequirement["status"])) {
    return key as ExtractedRequirement["status"];
  }
  return STATUS_SYNONYMS[key] ?? fallback;
}

export function normalizeVerificationStatus(
  value: unknown,
  fallback: ExtractedRequirement["verificationStatus"] = "unverified",
): ExtractedRequirement["verificationStatus"] {
  const key = normalizeKey(value);
  if (ALLOWED_VERIFICATION.has(key as ExtractedRequirement["verificationStatus"])) {
    return key as ExtractedRequirement["verificationStatus"];
  }
  return VERIFICATION_SYNONYMS[key] ?? fallback;
}

function normalizeNodeKey(value: unknown, category?: unknown): string {
  const key = normalizeKey(value);
  if (ALLOWED_NODE_KEYS.has(key)) {
    return key;
  }

  const categoryKey = normalizeKey(category);
  if (ALLOWED_NODE_KEYS.has(categoryKey)) {
    return categoryKey;
  }

  return "site_plan";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function normalizeRequirementRow(
  raw: unknown,
  index: number,
): ExtractedRequirement | null {
  const row = asRecord(raw);
  if (!row) {
    return null;
  }

  const title = typeof row.title === "string" ? row.title.trim() : "";
  if (!title) {
    return null;
  }

  const nodeKey = normalizeNodeKey(row.nodeKey, row.category);
  const category =
    typeof row.category === "string" && row.category.trim()
      ? row.category.trim()
      : nodeKey;

  const sortOrder =
    typeof row.sortOrder === "number" && Number.isFinite(row.sortOrder)
      ? row.sortOrder
      : index + 1;

  return {
    nodeKey,
    title,
    category,
    status: normalizeRequirementStatus(row.status),
    verificationStatus: normalizeVerificationStatus(row.verificationStatus),
    authority:
      typeof row.authority === "string" && row.authority.trim()
        ? row.authority.trim()
        : "City of Los Angeles",
    evidenceRequired:
      typeof row.evidenceRequired === "string" ? row.evidenceRequired : undefined,
    blockedReason:
      typeof row.blockedReason === "string" ? row.blockedReason : undefined,
    sourceKey: typeof row.sourceKey === "string" ? row.sourceKey : undefined,
    sourceExcerpt:
      typeof row.sourceExcerpt === "string" ? row.sourceExcerpt : undefined,
    sortOrder,
    isPrimaryBlocker: row.isPrimaryBlocker === true,
  };
}

export function salvageRequirementsExtraction(
  raw: unknown,
): { requirements: ExtractedRequirement[] } | null {
  const payload = asRecord(raw);
  if (!payload || !Array.isArray(payload.requirements)) {
    return null;
  }

  const requirements = payload.requirements
    .map((row, index) => normalizeRequirementRow(row, index))
    .filter((row): row is ExtractedRequirement => row !== null)
    .slice(0, 20);

  if (requirements.length === 0) {
    return null;
  }

  if (!requirements.some((row) => row.isPrimaryBlocker)) {
    const setback = requirements.find((row) => row.nodeKey === "setback");
    if (setback) {
      setback.isPrimaryBlocker = true;
      if (setback.status === "review") {
        setback.status = "blocked";
      }
    }
  }

  return { requirements };
}
