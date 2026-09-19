import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

export async function startAgentRun(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  actionType: string,
  trigger: string,
  message: string,
) {
  return await ctx.db.insert("agentRuns", {
    projectId,
    actionType,
    trigger,
    status: "running",
    message,
    startedAt: Date.now(),
  });
}

export async function completeAgentRun(
  ctx: MutationCtx,
  runId: Id<"agentRuns">,
  message: string,
  failed = false,
) {
  await ctx.db.patch("agentRuns", runId, {
    status: failed ? "failed" : "completed",
    message,
    completedAt: Date.now(),
  });
}
