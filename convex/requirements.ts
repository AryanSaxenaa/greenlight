import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { appendEvent, recomputeProjectMetrics } from "./lib/compiler";
import { PERMIT_GRAPH_EDGES } from "./lib/dependencies";
import {
  type ExtractedRequirement,
} from "./lib/requirementExtraction";
import { completeAgentRun, startAgentRun } from "./lib/agentRuns";

const requirementListItem = v.object({
  _id: v.id("requirements"),
  title: v.string(),
  category: v.string(),
  nodeKey: v.string(),
  status: v.union(
    v.literal("verified"),
    v.literal("blocked"),
    v.literal("review"),
    v.literal("missing"),
    v.literal("locked"),
  ),
  blockedReason: v.optional(v.string()),
  isPrimaryBlocker: v.boolean(),
});

const extractedRequirementValidator = v.object({
  nodeKey: v.string(),
  title: v.string(),
  category: v.string(),
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
  authority: v.string(),
  evidenceRequired: v.optional(v.string()),
  blockedReason: v.optional(v.string()),
  sourceKey: v.optional(v.string()),
  sourceExcerpt: v.optional(v.string()),
  sortOrder: v.number(),
  isPrimaryBlocker: v.boolean(),
});

export const listInternal = internalQuery({
  args: { projectId: v.id("projects") },
  returns: v.array(requirementListItem),
  handler: async (ctx, args) => {
    const requirements = await ctx.db
      .query("requirements")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    return requirements.map((requirement) => ({
      _id: requirement._id,
      title: requirement.title,
      category: requirement.category,
      nodeKey: requirement.nodeKey,
      status: requirement.status,
      blockedReason: requirement.blockedReason,
      isPrimaryBlocker: requirement.isPrimaryBlocker,
    }));
  },
});

export const applyExtractedInternal = internalMutation({
  args: {
    projectId: v.id("projects"),
    requirements: v.array(extractedRequirementValidator),
    aiUsed: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("requirements")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .take(1);

    if (existing.length > 0) {
      return null;
    }

    const runId = await startAgentRun(
      ctx,
      args.projectId,
      "extract_requirements",
      "compiler",
      args.aiUsed
        ? "Extracting structured requirements with OpenAI via Convex AI Gateway."
        : "Extracting structured requirements from official sources.",
    );

    const sources = await ctx.db
      .query("sources")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const sourceIds = new Map(sources.map((source) => [source.key, source._id]));
    await insertRequirements(
      ctx,
      args.projectId,
      args.requirements as ExtractedRequirement[],
      sourceIds,
      sources,
    );

    await ctx.db.patch("projects", args.projectId, {
      rulesExtracted: args.requirements.length,
      updatedAt: Date.now(),
    });

    await appendEvent(
      ctx,
      args.projectId,
      args.aiUsed ? "ai.requirements_extracted" : "requirements.extracted",
      args.aiUsed
        ? `OpenAI extracted ${args.requirements.length} structured requirements from official sources.`
        : `Extracted ${args.requirements.length} structured requirements from official sources.`,
      {
        actorType: "agent",
        actorLabel: args.aiUsed ? "OpenAI via Convex AI Gateway" : "Requirement extractor",
      },
    );

    await completeAgentRun(
      ctx,
      runId,
      args.aiUsed
        ? `OpenAI extracted ${args.requirements.length} requirements.`
        : `Extracted ${args.requirements.length} requirements.`,
    );

    return null;
  },
});

export const seedDependencies = internalMutation({
  args: { projectId: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("dependencies")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .take(1);

    if (existing.length > 0) {
      return null;
    }

    const requirements = await ctx.db
      .query("requirements")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const nodeKeys = new Set(requirements.map((requirement) => requirement.nodeKey));

    for (const edge of PERMIT_GRAPH_EDGES) {
      if (!nodeKeys.has(edge.fromNodeKey) || !nodeKeys.has(edge.toNodeKey)) {
        continue;
      }

      await ctx.db.insert("dependencies", {
        projectId: args.projectId,
        fromNodeKey: edge.fromNodeKey,
        toNodeKey: edge.toNodeKey,
        relationship: edge.relationship,
      });
    }

    await appendEvent(
      ctx,
      args.projectId,
      "graph.compiled",
      "Permit dependency graph compiled.",
      { actorType: "agent", actorLabel: "Dependency compiler" },
    );

    return null;
  },
});

export const reevaluateFromSourceChange = internalMutation({
  args: {
    projectId: v.id("projects"),
    sourceId: v.id("sources"),
    changeSummary: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const source = await ctx.db.get("sources", args.sourceId);
    if (!source) {
      return null;
    }

    const runId = await startAgentRun(
      ctx,
      args.projectId,
      "recompile_requirements",
      "source_monitor",
      `Re-evaluating requirements after ${source.label} changed.`,
    );

    const requirements = await ctx.db
      .query("requirements")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const affected = requirements.filter(
      (requirement) => requirement.sourceId === args.sourceId,
    );

    for (const requirement of affected) {
      await ctx.db.patch("requirements", requirement._id, {
        status: "review",
        verificationStatus: "unverified",
        blockedReason: `Official source changed: ${args.changeSummary}`,
        isPrimaryBlocker:
          requirement.isPrimaryBlocker || requirement.nodeKey === "setback",
      });
    }

    await recomputeProjectMetrics(ctx, args.projectId);

    await appendEvent(
      ctx,
      args.projectId,
      "source.changed",
      `Re-evaluating ${affected.length} requirements after ${source.label} changed.`,
      { actorType: "source", actorLabel: source.label },
    );

    await completeAgentRun(
      ctx,
      runId,
      `Re-evaluated ${affected.length} requirements.`,
    );

    return null;
  },
});

export const applyEvidenceToRequirements = internalMutation({
  args: {
    projectId: v.id("projects"),
    nodeKeys: v.array(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const requirements = await ctx.db
      .query("requirements")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    for (const nodeKey of args.nodeKeys) {
      const requirement = requirements.find((item) => item.nodeKey === nodeKey);
      if (!requirement) {
        continue;
      }

      if (requirement.status === "missing") {
        await ctx.db.patch("requirements", requirement._id, {
          status: "review",
          verificationStatus: "unverified",
        });
      }

      if (nodeKey === "site_plan" && requirement.status === "review") {
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

    await recomputeProjectMetrics(ctx, args.projectId);
    return null;
  },
});

async function insertRequirements(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  rows: ExtractedRequirement[],
  sourceIds: Map<string, Id<"sources">>,
  sources: Array<{ _id: Id<"sources">; key: string; label: string; url: string }>,
) {
  for (const row of rows) {
    const sourceId = row.sourceKey ? sourceIds.get(row.sourceKey) : undefined;
    const source = sourceId
      ? sources.find((item) => item._id === sourceId)
      : undefined;

    await ctx.db.insert("requirements", {
      projectId,
      nodeKey: row.nodeKey,
      title: row.title,
      category: row.category,
      status: row.status,
      verificationStatus: row.verificationStatus,
      authority: row.authority,
      sourceLabel: source?.label,
      sourceUrl: source?.url,
      sourceId,
      sourceExcerpt: row.sourceExcerpt,
      evidenceRequired: row.evidenceRequired,
      blockedReason: row.blockedReason,
      sortOrder: row.sortOrder,
      isPrimaryBlocker: row.isPrimaryBlocker,
    });
  }
}
