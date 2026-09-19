import type { Doc } from "../_generated/dataModel";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

export const COMPILER_STAGES = [
  { stageKey: "jurisdiction", label: "Jurisdiction", order: 1 },
  { stageKey: "authority_sources", label: "Authority sources", order: 2 },
  { stageKey: "project_classification", label: "Project classification", order: 3 },
  { stageKey: "applicable_regulations", label: "Applicable regulations", order: 4 },
  { stageKey: "permit_pathway", label: "Permit pathway", order: 5 },
  { stageKey: "evidence_requirements", label: "Evidence requirements", order: 6 },
  { stageKey: "dependency_graph", label: "Dependency graph", order: 7 },
] as const;

export type EventActor = {
  actorType: "user" | "agent" | "agency" | "source" | "system";
  actorLabel?: string;
};

export async function appendEvent(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  type: string,
  message: string,
  actor: EventActor = { actorType: "system", actorLabel: "Greenlight" },
) {
  await ctx.db.insert("projectEvents", {
    projectId,
    type,
    message,
    actorType: actor.actorType,
    actorLabel: actor.actorLabel,
    createdAt: Date.now(),
  });
}

export async function seedCompilerStages(
  ctx: MutationCtx,
  projectId: Id<"projects">,
) {
  for (const stage of COMPILER_STAGES) {
    await ctx.db.insert("compilerStages", {
      projectId,
      stageKey: stage.stageKey,
      label: stage.label,
      order: stage.order,
      status: stage.order === 1 ? "running" : "waiting",
    });
  }
}

export async function setStageStatus(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  stageKey: string,
  status: "waiting" | "running" | "complete",
) {
  const stages = await ctx.db
    .query("compilerStages")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .collect();

  const stage = stages.find((item) => item.stageKey === stageKey);
  if (!stage) {
    return;
  }

  await ctx.db.patch("compilerStages", stage._id, { status });
}

export async function runStage(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  stageKey: string,
  label: string,
  work: () => Promise<void>,
) {
  await setStageStatus(ctx, projectId, stageKey, "running");
  await appendEvent(
    ctx,
    projectId,
    "compiler.stage",
    `${label} running.`,
    { actorType: "agent", actorLabel: "Compiler" },
  );
  await work();
  await setStageStatus(ctx, projectId, stageKey, "complete");
  await appendEvent(
    ctx,
    projectId,
    "compiler.stage",
    `${label} complete.`,
    { actorType: "agent", actorLabel: "Compiler" },
  );
}

export function computeReadiness(requirements: Array<Doc<"requirements">>) {
  const eligible = requirements.filter((requirement) => requirement.status !== "locked");
  if (eligible.length === 0) {
    return 0;
  }
  const verified = eligible.filter((requirement) => requirement.status === "verified").length;
  return Math.round((verified / eligible.length) * 100);
}

export async function recomputeProjectMetrics(
  ctx: MutationCtx,
  projectId: Id<"projects">,
) {
  const requirements = await ctx.db
    .query("requirements")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .collect();

  const blockerCount = requirements.filter((requirement) => requirement.status === "blocked").length;
  const reviewCount = requirements.filter(
    (requirement) =>
      requirement.status === "review" || requirement.verificationStatus === "unknown",
  ).length;
  const missingCount = requirements.filter((requirement) => requirement.status === "missing").length;
  const primary =
    requirements.find((requirement) => requirement.isPrimaryBlocker) ??
    requirements.find((requirement) => requirement.status === "blocked");

  await ctx.db.patch("projects", projectId, {
    readinessPercent: computeReadiness(requirements),
    requirementCount: requirements.length,
    blockerCount,
    unknownCount: reviewCount,
    nextAction:
      missingCount > 0
        ? "Upload missing evidence for open requirements."
        : primary
          ? "Review primary blocker and draft agency clarification."
          : "Review project readiness.",
    primaryBlocker: primary?.title,
    primaryBlockerReason: primary?.blockedReason ?? primary?.sourceExcerpt,
    primaryBlockerSource: primary?.sourceLabel,
    updatedAt: Date.now(),
  });
}
