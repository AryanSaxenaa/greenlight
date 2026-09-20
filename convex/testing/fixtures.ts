import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { seedCompilerStages } from "../lib/compiler";
import { LA_OFFICIAL_SOURCES } from "../lib/sources";

const SAMPLE_ADU_MARKDOWN = `
# Accessory Dwelling Units (ADUs)
Detached ADUs must maintain a rear setback of at least 4 feet from the property line.
Maximum building height for detached ADUs is 16 feet.
Parking may be waived for ADUs within one-half mile of transit.
A scaled site plan showing existing and proposed structures is required for plan check.
Structural calculations are required when modifying load-bearing elements.
`.trim();

export const getLatestProjectInternal = internalQuery({
  args: {},
  returns: v.union(v.id("projects"), v.null()),
  handler: async (ctx) => {
    const project = await ctx.db.query("projects").order("desc").first();
    return project?._id ?? null;
  },
});

export const prepareAiTestProjectInternal = internalMutation({
  args: {
    suffix: v.string(),
  },
  returns: v.object({
    projectId: v.id("projects"),
    userId: v.id("users"),
    reused: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("projects")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .order("desc")
      .first();

    if (existing && existing.requirementCount > 0) {
      return {
        projectId: existing._id,
        userId: existing.userId,
        reused: true,
      };
    }

    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      email: `ai-test-${args.suffix}@example.test`,
      createdAt: now,
    });

    const projectId = await ctx.db.insert("projects", {
      userId,
      title: `AI test ${args.suffix}`,
      intent: "Convert detached garage into an ADU",
      address: "1234 Sunset Blvd, Los Angeles, CA 90026",
      normalizedAddress: "1234 Sunset Blvd, Los Angeles, CA 90026",
      jurisdiction: "Los Angeles",
      city: "Los Angeles",
      county: "Los Angeles County",
      state: "CA",
      readinessPercent: 0,
      status: "compiling",
      permitPathStages: 0,
      requirementCount: 0,
      blockerCount: 0,
      unknownCount: 0,
      sourcesDiscovered: 0,
      sourcesRetrieved: 0,
      rulesExtracted: 0,
      createdAt: now,
      updatedAt: now,
    });

    await seedCompilerStages(ctx, projectId);

    for (const source of LA_OFFICIAL_SOURCES) {
      const sourceId = await ctx.db.insert("sources", {
        projectId,
        key: source.key,
        url: source.url,
        authority: source.authority,
        label: source.label,
        sourceType: source.sourceType,
        official: true,
        healthStatus: "current",
        lastScrapedAt: now,
      });

      await ctx.db.insert("sourceSnapshots", {
        sourceId,
        projectId,
        retrievedAt: now,
        title: source.label,
        contentHash: `test-${source.key}-${args.suffix}`,
        markdownPreview: SAMPLE_ADU_MARKDOWN,
        changeStatus: "retrieved",
      });
    }

    await ctx.db.patch("projects", projectId, {
      sourcesDiscovered: LA_OFFICIAL_SOURCES.length,
      sourcesRetrieved: LA_OFFICIAL_SOURCES.length,
      updatedAt: now,
    });

    await ctx.db.insert("projectParameters", {
      projectId,
      key: "proposedAduHeightFt",
      value: "16",
      unit: "ft",
      source: "user_intent",
      verificationStatus: "unverified",
      updatedAt: now,
    });

    return { projectId, userId, reused: false };
  },
});

export const resetRequirementsInternal = internalMutation({
  args: { projectId: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const requirements = await ctx.db
      .query("requirements")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    for (const requirement of requirements) {
      await ctx.db.delete("requirements", requirement._id);
    }

    const approvals = await ctx.db
      .query("approvals")
      .withIndex("by_project_and_status", (q) =>
        q.eq("projectId", args.projectId).eq("status", "pending"),
      )
      .collect();
    for (const approval of approvals) {
      await ctx.db.delete("approvals", approval._id);
    }

    return null;
  },
});

export const seedRequirementForEmailTestInternal = internalMutation({
  args: { projectId: v.id("projects") },
  returns: v.id("requirements"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("requirements")
      .withIndex("by_project_and_node", (q) =>
        q.eq("projectId", args.projectId).eq("nodeKey", "setback"),
      )
      .unique();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("requirements", {
      projectId: args.projectId,
      nodeKey: "setback",
      title: "Rear setback applicability",
      category: "setback",
      status: "blocked",
      verificationStatus: "known",
      authority: "City Planning",
      blockedReason: "Official ADU guidance references rear setback rules for this lot.",
      sortOrder: 3,
      isPrimaryBlocker: true,
    });
  },
});

export const createTextDocumentInternal = internalMutation({
  args: {
    projectId: v.id("projects"),
    userId: v.id("users"),
    storageId: v.id("_storage"),
    suffix: v.string(),
  },
  returns: v.id("documents"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("documents", {
      projectId: args.projectId,
      storageId: args.storageId,
      filename: `site-plan-${args.suffix}.txt`,
      mimeType: "text/plain",
      documentType: "site_plan",
      uploadedBy: args.userId,
      createdAt: Date.now(),
    });
  },
});
