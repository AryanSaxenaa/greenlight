import type { Id } from "./_generated/dataModel";
import { internalMutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";
import { requireProjectAccess } from "./lib/auth";
import { LA_OFFICIAL_SOURCES } from "./lib/sources";

const sourceValidator = v.object({
  _id: v.id("sources"),
  _creationTime: v.number(),
  projectId: v.id("projects"),
  key: v.string(),
  url: v.string(),
  authority: v.string(),
  label: v.string(),
  sourceType: v.string(),
  official: v.boolean(),
  monitorId: v.optional(v.string()),
  lastScrapedAt: v.optional(v.number()),
});

const snapshotValidator = v.object({
  _id: v.id("sourceSnapshots"),
  _creationTime: v.number(),
  sourceId: v.id("sources"),
  projectId: v.id("projects"),
  retrievedAt: v.number(),
  title: v.optional(v.string()),
  contentHash: v.string(),
  markdownPreview: v.string(),
  storageId: v.optional(v.id("_storage")),
  changeStatus: v.optional(v.string()),
});

export const listInternal = internalQuery({
  args: { projectId: v.id("projects") },
  returns: v.object({
    sources: v.array(sourceValidator),
  }),
  handler: async (ctx, args) => {
    const sources = await ctx.db
      .query("sources")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    return { sources };
  },
});

export const listForProject = query({
  args: { projectId: v.id("projects") },
  returns: v.object({
    sources: v.array(sourceValidator),
    snapshots: v.array(snapshotValidator),
  }),
  handler: async (ctx, args) => {
    await requireProjectAccess(ctx, args.projectId);

    const sources = await ctx.db
      .query("sources")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const snapshots = [];
    for (const source of sources) {
      const latest = await ctx.db
        .query("sourceSnapshots")
        .withIndex("by_source", (q) => q.eq("sourceId", source._id))
        .order("desc")
        .take(1);
      if (latest[0]) {
        snapshots.push(latest[0]);
      }
    }

    return { sources, snapshots };
  },
});

export const seedOfficialSources = internalMutation({
  args: { projectId: v.id("projects") },
  returns: v.array(v.id("sources")),
  handler: async (ctx, args) => {
    const sourceIds: Array<Id<"sources">> = [];

    for (const source of LA_OFFICIAL_SOURCES) {
      const existing = await ctx.db
        .query("sources")
        .withIndex("by_project", (q) =>
          q.eq("projectId", args.projectId).eq("key", source.key),
        )
        .unique();

      if (existing) {
        sourceIds.push(existing._id);
        continue;
      }

      const sourceId = await ctx.db.insert("sources", {
        projectId: args.projectId,
        key: source.key,
        url: source.url,
        authority: source.authority,
        label: source.label,
        sourceType: source.sourceType,
        official: true,
      });
      sourceIds.push(sourceId);
    }

    return sourceIds;
  },
});

export const storeSnapshot = internalMutation({
  args: {
    sourceId: v.id("sources"),
    projectId: v.id("projects"),
    title: v.optional(v.string()),
    contentHash: v.string(),
    markdownPreview: v.string(),
    storageId: v.optional(v.id("_storage")),
    changeStatus: v.optional(v.string()),
  },
  returns: v.id("sourceSnapshots"),
  handler: async (ctx, args) => {
    const snapshotId = await ctx.db.insert("sourceSnapshots", {
      sourceId: args.sourceId,
      projectId: args.projectId,
      retrievedAt: Date.now(),
      title: args.title,
      contentHash: args.contentHash,
      markdownPreview: args.markdownPreview,
      storageId: args.storageId,
      changeStatus: args.changeStatus,
    });

    await ctx.db.patch("sources", args.sourceId, {
      lastScrapedAt: Date.now(),
    });

    return snapshotId;
  },
});

export const getByMonitorInternal = internalQuery({
  args: { monitorId: v.string() },
  returns: v.union(sourceValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sources")
      .withIndex("by_monitor", (q) => q.eq("monitorId", args.monitorId))
      .unique();
  },
});

export const setMonitorInternal = internalMutation({
  args: {
    sourceId: v.id("sources"),
    monitorId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch("sources", args.sourceId, {
      monitorId: args.monitorId,
    });
    return null;
  },
});
