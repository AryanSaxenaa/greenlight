import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { appendEvent, recomputeProjectMetrics } from "./lib/compiler";
import { PERMIT_GRAPH_EDGES } from "./lib/dependencies";
import {
  type ExtractedRequirement,
  mergeRequirements,
} from "./lib/requirementExtraction";
import {
  collectDocumentFacts,
  parseOfficialLookups,
} from "./lib/officialLookup";
import { requirementNodeKeysForDocumentType } from "./lib/documentExtraction";
import { applyDerivedEvidenceUpdates, applyEvidenceStatusForRequirement } from "./lib/evidenceStatus";
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
      .collect();

    const existingByKey = new Map(
      existing.map((requirement) => [requirement.nodeKey, requirement]),
    );
    const isFirstRun = existing.length === 0;

    const sources = await ctx.db
      .query("sources")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const sourceIds = new Map(sources.map((source) => [source.key, source._id]));
    const rows = args.requirements as ExtractedRequirement[];

    let runId: Id<"agentRuns"> | null = null;
    if (isFirstRun) {
      runId = await startAgentRun(
        ctx,
        args.projectId,
        "extract_requirements",
        "compiler",
        args.aiUsed
          ? "Extracting structured requirements with OpenAI via Convex AI Gateway."
          : "Extracting structured requirements from official sources.",
      );
    }

    const inserted = await upsertRequirements(
      ctx,
      args.projectId,
      rows,
      sourceIds,
      sources,
      existingByKey,
    );

    const allRequirements = await ctx.db
      .query("requirements")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    await ctx.db.patch("projects", args.projectId, {
      rulesExtracted: allRequirements.length,
      updatedAt: Date.now(),
    });

    await recomputeProjectMetrics(ctx, args.projectId);
    await seedDependenciesForProject(ctx, args.projectId, { emitEvent: !isFirstRun && inserted === 0 });

    if (runId) {
      await appendEvent(
        ctx,
        args.projectId,
        args.aiUsed ? "ai.requirements_extracted" : "requirements.extracted",
        args.aiUsed
          ? `OpenAI extracted ${allRequirements.length} structured requirements from official sources.`
          : `Extracted ${allRequirements.length} structured requirements from official sources.`,
        {
          actorType: "agent",
          actorLabel: args.aiUsed ? "OpenAI via Convex AI Gateway" : "Requirement extractor",
        },
      );

      await completeAgentRun(
        ctx,
        runId,
        args.aiUsed
          ? `OpenAI extracted ${allRequirements.length} requirements.`
          : `Extracted ${allRequirements.length} requirements.`,
      );
    } else if (inserted > 0) {
      await appendEvent(
        ctx,
        args.projectId,
        args.aiUsed ? "ai.requirements_updated" : "requirements.updated",
        `Added ${inserted} requirements from official sources.`,
        {
          actorType: "agent",
          actorLabel: args.aiUsed ? "OpenAI via Convex AI Gateway" : "Requirement extractor",
        },
      );
    }

    return null;
  },
});

export const ensurePathwayInternal = internalMutation({
  args: {
    projectId: v.id("projects"),
    intent: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const merged = mergeRequirements(args.intent, [], []);
    await upsertRequirementsFromRows(ctx, args.projectId, merged);
    await seedDependenciesForProject(ctx, args.projectId, { emitEvent: false });
    await recomputeProjectMetrics(ctx, args.projectId);
    return null;
  },
});

export const applyOfficialLookupsInternal = internalMutation({
  args: { projectId: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get("projects", args.projectId);
    if (!project) {
      return null;
    }

    const sources = await ctx.db
      .query("sources")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const bundledSources = [];
    for (const source of sources) {
      const latest = await ctx.db
        .query("sourceSnapshots")
        .withIndex("by_source", (q) => q.eq("sourceId", source._id))
        .order("desc")
        .take(1);
      const snapshot = latest[0];
      if (!snapshot) {
        continue;
      }
      bundledSources.push({
        key: source.key,
        markdown: snapshot.markdownPreview,
        healthStatus: source.healthStatus,
      });
    }

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const signals = parseOfficialLookups({
      address: project.normalizedAddress ?? project.address,
      jurisdiction: project.jurisdiction,
      sources: bundledSources,
      documentFacts: collectDocumentFacts(documents),
    });

    const requirements = await ctx.db
      .query("requirements")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    if (signals.propertyVerified) {
      const property = requirements.find((requirement) => requirement.nodeKey === "property");
      if (property && property.status !== "verified") {
        await ctx.db.patch("requirements", property._id, {
          status: "verified",
          verificationStatus: "known",
          blockedReason: signals.propertyNote,
        });
      }
    }

    if (signals.zoningVerified && signals.zoningCode) {
      const zoning = requirements.find((requirement) => requirement.nodeKey === "zoning");
      if (zoning && zoning.status !== "verified") {
        await ctx.db.patch("requirements", zoning._id, {
          status: "verified",
          verificationStatus: "known",
          blockedReason: signals.zoningNote,
          sourceExcerpt: `Zoning: ${signals.zoningCode}`,
        });
      }

      await ctx.db.patch("projects", args.projectId, {
        zoning: signals.zoningCode,
        updatedAt: Date.now(),
      });
    }

    await recomputeProjectMetrics(ctx, args.projectId);
    return null;
  },
});

export const relinkDocumentsInternal = internalMutation({
  args: { projectId: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    for (const document of documents) {
      if (!document.extractedFacts || document.extractedFacts.length === 0) {
        continue;
      }

      await relinkDocumentEvidence(ctx, {
        projectId: args.projectId,
        documentId: document._id,
        facts: document.extractedFacts,
        nodeKeys: requirementNodeKeysForDocumentType(document.documentType),
      });
    }

    await recomputeProjectMetrics(ctx, args.projectId);
    return null;
  },
});

async function relinkDocumentEvidence(
  ctx: MutationCtx,
  args: {
    projectId: Id<"projects">;
    documentId: Id<"documents">;
    facts: Array<{ label: string; value: string; confidence?: number }>;
    nodeKeys: string[];
  },
) {
  const priorLinks = await ctx.db
    .query("evidenceLinks")
    .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
    .collect();

  for (const link of priorLinks) {
    if (link.documentId === args.documentId) {
      await ctx.db.delete("evidenceLinks", link._id);
    }
  }

  const requirements = await ctx.db
    .query("requirements")
    .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
    .collect();

  for (const nodeKey of args.nodeKeys) {
    const requirement = requirements.find((item) => item.nodeKey === nodeKey);
    if (!requirement) {
      continue;
    }

    for (const fact of args.facts) {
      await ctx.db.insert("evidenceLinks", {
        projectId: args.projectId,
        documentId: args.documentId,
        requirementId: requirement._id,
        fact: `${fact.label}: ${fact.value}`,
        confidence: fact.confidence ?? 0.8,
        createdAt: Date.now(),
      });
    }

    await applyEvidenceStatusForRequirement(ctx, requirement, nodeKey);
  }

  await applyDerivedEvidenceUpdates(ctx, args.projectId, args.documentId, args.facts, requirements);
}

async function upsertRequirementsFromRows(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  rows: ExtractedRequirement[],
) {
  const existing = await ctx.db
    .query("requirements")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .collect();

  const existingByKey = new Map(
    existing.map((requirement) => [requirement.nodeKey, requirement]),
  );

  const sources = await ctx.db
    .query("sources")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .collect();

  const sourceIds = new Map(sources.map((source) => [source.key, source._id]));

  await upsertRequirements(
    ctx,
    projectId,
    rows,
    sourceIds,
    sources,
    existingByKey,
  );
}

export const seedDependencies = internalMutation({
  args: { projectId: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await seedDependenciesForProject(ctx, args.projectId, { emitEvent: true });
    return null;
  },
});

async function seedDependenciesForProject(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  options: { emitEvent: boolean },
) {
  const requirements = await ctx.db
    .query("requirements")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .collect();

  const nodeKeys = new Set(requirements.map((requirement) => requirement.nodeKey));
  const existingEdges = await ctx.db
    .query("dependencies")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .collect();

  const existingPairs = new Set(
    existingEdges.map((edge) => `${edge.fromNodeKey}->${edge.toNodeKey}`),
  );

  let inserted = 0;
  for (const edge of PERMIT_GRAPH_EDGES) {
    if (!nodeKeys.has(edge.fromNodeKey) || !nodeKeys.has(edge.toNodeKey)) {
      continue;
    }

    const pair = `${edge.fromNodeKey}->${edge.toNodeKey}`;
    if (existingPairs.has(pair)) {
      continue;
    }

    await ctx.db.insert("dependencies", {
      projectId,
      fromNodeKey: edge.fromNodeKey,
      toNodeKey: edge.toNodeKey,
      relationship: edge.relationship,
    });
    inserted += 1;
  }

  if (!options.emitEvent) {
    return;
  }

  if (inserted > 0) {
    await appendEvent(
      ctx,
      projectId,
      "graph.compiled",
      inserted === 1
        ? "Permit dependency graph updated with a new edge."
        : `Permit dependency graph updated with ${inserted} new edges.`,
      { actorType: "agent", actorLabel: "Dependency compiler" },
    );
  } else if (existingEdges.length === 0) {
    await appendEvent(
      ctx,
      projectId,
      "graph.compiled",
      "Permit dependency graph compiled.",
      { actorType: "agent", actorLabel: "Dependency compiler" },
    );
  }
}

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

      await applyEvidenceStatusForRequirement(ctx, requirement, nodeKey);
    }

    await recomputeProjectMetrics(ctx, args.projectId);
    return null;
  },
});

async function upsertRequirements(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  rows: ExtractedRequirement[],
  sourceIds: Map<string, Id<"sources">>,
  sources: Array<{ _id: Id<"sources">; key: string; label: string; url: string }>,
  existingByKey: Map<string, { _id: Id<"requirements">; status: ExtractedRequirement["status"] }>,
): Promise<number> {
  let inserted = 0;

  for (const row of rows) {
    const sourceId = row.sourceKey ? sourceIds.get(row.sourceKey) : undefined;
    const source = sourceId
      ? sources.find((item) => item._id === sourceId)
      : undefined;

    const payload = {
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
    };

    const existing = existingByKey.get(row.nodeKey);
    if (!existing) {
      await ctx.db.insert("requirements", {
        projectId,
        nodeKey: row.nodeKey,
        ...payload,
      });
      inserted += 1;
      continue;
    }

    if (existing.status === "verified") {
      continue;
    }

    await ctx.db.patch("requirements", existing._id, payload);
  }

  return inserted;
}
