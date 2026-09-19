import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

export const COMPILER_STAGES = [
  { stageKey: "jurisdiction", label: "Jurisdiction", order: 1 },
  { stageKey: "authority_sources", label: "Authority sources", order: 2 },
  { stageKey: "project_classification", label: "Project classification", order: 3 },
  { stageKey: "applicable_regulations", label: "Applicable regulations", order: 4 },
  { stageKey: "permit_pathway", label: "Permit pathway", order: 5 },
  { stageKey: "evidence_requirements", label: "Evidence requirements", order: 6 },
  { stageKey: "dependency_graph", label: "Dependency graph", order: 7 },
] as const;

export async function appendEvent(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  type: string,
  message: string,
) {
  await ctx.db.insert("projectEvents", {
    projectId,
    type,
    message,
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
