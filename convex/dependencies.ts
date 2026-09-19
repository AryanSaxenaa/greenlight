import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireProjectAccess } from "./lib/auth";

const dependencyValidator = v.object({
  _id: v.id("dependencies"),
  fromNodeKey: v.string(),
  toNodeKey: v.string(),
  relationship: v.string(),
});

const graphNodeValidator = v.object({
  nodeKey: v.string(),
  title: v.string(),
  status: v.union(
    v.literal("verified"),
    v.literal("blocked"),
    v.literal("review"),
    v.literal("missing"),
    v.literal("locked"),
  ),
  verificationStatus: v.union(
    v.literal("known"),
    v.literal("unverified"),
    v.literal("unknown"),
    v.literal("conflicted"),
  ),
  isPrimaryBlocker: v.boolean(),
  sourceLabel: v.optional(v.string()),
  sourceUrl: v.optional(v.string()),
  sourceExcerpt: v.optional(v.string()),
});

export const getGraph = query({
  args: { projectId: v.id("projects") },
  returns: v.object({
    nodes: v.array(graphNodeValidator),
    edges: v.array(dependencyValidator),
  }),
  handler: async (ctx, args) => {
    await requireProjectAccess(ctx, args.projectId);

    const requirements = await ctx.db
      .query("requirements")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const edges = await ctx.db
      .query("dependencies")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const nodes = requirements
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((requirement) => ({
        nodeKey: requirement.nodeKey,
        title: requirement.title,
        status: requirement.status,
        verificationStatus: requirement.verificationStatus,
        isPrimaryBlocker: requirement.isPrimaryBlocker,
        sourceLabel: requirement.sourceLabel,
        sourceUrl: requirement.sourceUrl,
        sourceExcerpt: requirement.sourceExcerpt,
      }));

    return {
      nodes,
      edges: edges.map((edge) => ({
        _id: edge._id,
        fromNodeKey: edge.fromNodeKey,
        toNodeKey: edge.toNodeKey,
        relationship: edge.relationship,
      })),
    };
  },
});
