import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

type RequirementStatus =
  | "verified"
  | "blocked"
  | "review"
  | "missing"
  | "locked";

type RequirementRow = {
  _id: Id<"requirements">;
  nodeKey: string;
  status: RequirementStatus;
  isPrimaryBlocker: boolean;
};

export async function applyEvidenceStatusForRequirement(
  ctx: MutationCtx,
  requirement: RequirementRow,
  nodeKey: string,
) {
  let status = requirement.status;
  if (status === "missing") {
    await ctx.db.patch("requirements", requirement._id, {
      status: "review",
      verificationStatus: "unverified",
    });
    status = "review";
  }

  if (nodeKey === "site_plan" && status === "review") {
    const evidence = await ctx.db
      .query("evidenceLinks")
      .withIndex("by_requirement", (q) => q.eq("requirementId", requirement._id))
      .take(2);
    if (evidence.length >= 2) {
      await ctx.db.patch("requirements", requirement._id, {
        status: "verified",
        verificationStatus: "known",
      });
    }
  }

  if (nodeKey === "structural") {
    const evidence = await ctx.db
      .query("evidenceLinks")
      .withIndex("by_requirement", (q) => q.eq("requirementId", requirement._id))
      .take(2);
    if (evidence.length >= 2) {
      await ctx.db.patch("requirements", requirement._id, {
        status: "verified",
        verificationStatus: "known",
      });
    }
  }
}

function parseFeet(value: string): number | null {
  const normalized = value.replace(/['"]/g, "").trim();
  const match = normalized.match(/([0-9]+(?:\.\d+)?)/);
  if (!match?.[1]) {
    return null;
  }
  return Number.parseFloat(match[1]);
}

export async function applyDerivedEvidenceUpdates(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  documentId: Id<"documents">,
  facts: Array<{ label: string; value: string; confidence?: number }>,
  requirements: RequirementRow[],
) {
  const rearSetbackFact = facts.find((fact) => /rear setback/i.test(fact.label));
  const heightFact = facts.find((fact) => /height/i.test(fact.label));
  const zoningFact = facts.find((fact) => /zoning/i.test(fact.label));

  if (rearSetbackFact) {
    const setback = requirements.find((item) => item.nodeKey === "setback");
    const feet = parseFeet(rearSetbackFact.value);
    if (setback && feet !== null && feet >= 4) {
      await linkFactToRequirement(
        ctx,
        projectId,
        documentId,
        setback._id,
        rearSetbackFact,
      );
      if (setback.status !== "verified") {
        await ctx.db.patch("requirements", setback._id, {
          status: "verified",
          verificationStatus: "known",
          isPrimaryBlocker: false,
          blockedReason: `Rear setback ${rearSetbackFact.value} documented on uploaded plan.`,
          sourceExcerpt: `Rear setback: ${rearSetbackFact.value}`,
        });
      }
    }
  }

  if (heightFact) {
    const height = requirements.find((item) => item.nodeKey === "height");
    const feet = parseFeet(heightFact.value);
    if (height && feet !== null && feet <= 16) {
      await linkFactToRequirement(ctx, projectId, documentId, height._id, heightFact);
      if (height.status !== "verified") {
        await ctx.db.patch("requirements", height._id, {
          status: "verified",
          verificationStatus: "known",
          blockedReason: `Proposed height ${heightFact.value} within ADU limit on uploaded plan.`,
        });
      }
    }
  }

  if (zoningFact) {
    const zoning = requirements.find((item) => item.nodeKey === "zoning");
    if (zoning && zoning.status !== "verified") {
      await linkFactToRequirement(ctx, projectId, documentId, zoning._id, zoningFact);
      await ctx.db.patch("requirements", zoning._id, {
        status: "verified",
        verificationStatus: "known",
        sourceExcerpt: `Zoning: ${zoningFact.value}`,
      });
      await ctx.db.patch("projects", projectId, {
        zoning: zoningFact.value.trim().toUpperCase(),
        updatedAt: Date.now(),
      });
    }
  }

  const primaryBlockers = requirements.filter((item) => item.isPrimaryBlocker);
  for (const blocker of primaryBlockers) {
    const refreshed = await ctx.db.get("requirements", blocker._id);
    if (refreshed?.status === "verified" && refreshed.isPrimaryBlocker) {
      await ctx.db.patch("requirements", blocker._id, {
        isPrimaryBlocker: false,
      });
    }
  }
}

async function linkFactToRequirement(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  documentId: Id<"documents">,
  requirementId: Id<"requirements">,
  fact: { label: string; value: string; confidence?: number },
) {
  const existing = await ctx.db
    .query("evidenceLinks")
    .withIndex("by_requirement", (q) => q.eq("requirementId", requirementId))
    .collect();

  const factText = `${fact.label}: ${fact.value}`;
  if (existing.some((link) => link.documentId === documentId && link.fact === factText)) {
    return;
  }

  await ctx.db.insert("evidenceLinks", {
    projectId,
    documentId,
    requirementId,
    fact: factText,
    confidence: fact.confidence ?? 0.85,
    createdAt: Date.now(),
  });
}
