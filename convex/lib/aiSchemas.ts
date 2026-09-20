import { z } from "zod";

export const GREENLIGHT_AI_MODEL = "openai/gpt-4o-mini" as const;

const requirementStatus = z.enum([
  "verified",
  "blocked",
  "review",
  "missing",
  "locked",
]);

const verificationStatus = z.enum(["known", "unverified", "unknown", "conflicted"]);

export const extractedRequirementSchema = z.object({
  nodeKey: z.string(),
  title: z.string(),
  category: z.string(),
  status: requirementStatus,
  verificationStatus: verificationStatus,
  authority: z.string(),
  evidenceRequired: z.string().optional(),
  blockedReason: z.string().optional(),
  sourceKey: z.string().optional(),
  sourceExcerpt: z.string().optional(),
  sortOrder: z.number(),
  isPrimaryBlocker: z.boolean(),
});

export const requirementsExtractionSchema = z.object({
  requirements: z.array(extractedRequirementSchema).max(20),
});

export const inboundEmailSchema = z.object({
  classification: z.string(),
  detectedDecision: z.string(),
  projectImpact: z.string(),
  actionRequired: z.string(),
  linkedRequirementNodeKey: z.string().optional(),
  extractions: z
    .array(
      z.object({
        extractionType: z.string(),
        value: z.string(),
        confidence: z.number().min(0).max(1),
      }),
    )
    .max(10),
});

export const clarificationDraftSchema = z.object({
  subject: z.string(),
  body: z.string(),
  factsUsed: z.array(z.string()).max(20),
});

export const documentFactsSchema = z.object({
  facts: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
        confidence: z.number().min(0).max(1),
      }),
    )
    .max(15),
});
