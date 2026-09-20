import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireProjectAccess } from "./lib/auth";
import { completeAgentRun, startAgentRun } from "./lib/agentRuns";

const agentRunValidator = v.object({
  _id: v.id("agentRuns"),
  _creationTime: v.number(),
  projectId: v.id("projects"),
  actionType: v.string(),
  trigger: v.string(),
  status: v.union(
    v.literal("running"),
    v.literal("completed"),
    v.literal("failed"),
  ),
  message: v.string(),
  startedAt: v.number(),
  completedAt: v.optional(v.number()),
});

export const listForProject = query({
  args: { projectId: v.id("projects") },
  returns: v.array(agentRunValidator),
  handler: async (ctx, args) => {
    await requireProjectAccess(ctx, args.projectId);
    return await ctx.db
      .query("agentRuns")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(20);
  },
});

export const startInternal = internalMutation({
  args: {
    projectId: v.id("projects"),
    actionType: v.string(),
    trigger: v.string(),
    message: v.string(),
  },
  returns: v.id("agentRuns"),
  handler: async (ctx, args) => {
    return await startAgentRun(
      ctx,
      args.projectId,
      args.actionType,
      args.trigger,
      args.message,
    );
  },
});

export const completeInternal = internalMutation({
  args: {
    runId: v.id("agentRuns"),
    message: v.string(),
    failed: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await completeAgentRun(ctx, args.runId, args.message, args.failed ?? false);
    return null;
  },
});
