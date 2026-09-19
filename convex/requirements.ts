import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { appendEvent } from "./lib/compiler";
import {
  baseRequirements,
  extractRequirementsFromMarkdown,
  type ExtractedRequirement,
} from "./lib/requirementExtraction";

export const listInternal = internalQuery({
  args: { projectId: v.id("projects") },
  returns: v.array(
    v.object({
      _id: v.id("requirements"),
      title: v.string(),
      category: v.string(),
      status: v.union(
        v.literal("verified"),
        v.literal("blocked"),
        v.literal("review"),
        v.literal("missing"),
        v.literal("locked"),
      ),
      blockedReason: v.optional(v.string()),
      isPrimaryBlocker: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    const requirements = await ctx.db
      .query("requirements")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    return requirements.map((requirement) => ({
      _id: requirement._id,
      title: requirement.title,
      category: requirement.category,
      status: requirement.status,
      blockedReason: requirement.blockedReason,
      isPrimaryBlocker: requirement.isPrimaryBlocker,
    }));
  },
});

export const applyFromSnapshots = internalMutation({
  args: { projectId: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("requirements")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .take(1);

    if (existing.length > 0) {
      return null;
    }

    const sources = await ctx.db
      .query("sources")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const sourceIds = new Map(sources.map((source) => [source.key, source._id]));
    const extracted: ExtractedRequirement[] = [...baseRequirements()];

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

      extracted.push(
        ...extractRequirementsFromMarkdown(snapshot.markdownPreview, source.key),
      );
    }

    const deduped = dedupeRequirements(extracted);
    await insertRequirements(ctx, args.projectId, deduped, sourceIds, sources);

    await appendEvent(
      ctx,
      args.projectId,
      "requirements.extracted",
      `Extracted ${deduped.length} structured requirements from official sources.`,
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
        blockedReason: `Official source changed: ${args.changeSummary}`,
        isPrimaryBlocker: requirement.isPrimaryBlocker || requirement.category === "setback",
      });
    }

    await appendEvent(
      ctx,
      args.projectId,
      "source.changed",
      `Re-evaluating ${affected.length} requirements after ${source.label} changed.`,
    );

    return null;
  },
});

function dedupeRequirements(rows: ExtractedRequirement[]): ExtractedRequirement[] {
  const seen = new Set<string>();
  const deduped: ExtractedRequirement[] = [];

  for (const row of rows.sort((left, right) => left.sortOrder - right.sortOrder)) {
    const key = `${row.category}:${row.title}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(row);
  }

  if (!deduped.some((row) => row.isPrimaryBlocker)) {
    const setback = deduped.find((row) => row.category === "setback");
    if (setback) {
      setback.isPrimaryBlocker = true;
      setback.status = "blocked";
    }
  }

  return deduped;
}

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
      title: row.title,
      category: row.category,
      status: row.status,
      authority: row.authority,
      sourceLabel: source?.label,
      sourceUrl: source?.url,
      sourceId,
      evidenceRequired: row.evidenceRequired,
      blockedReason: row.excerpt ?? row.blockedReason,
      sortOrder: row.sortOrder,
      isPrimaryBlocker: row.isPrimaryBlocker,
    });
  }
}
