import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalMutation } from "../_generated/server";
import { appendEvent } from "../lib/compiler";

export const processMonitorPage = internalMutation({
  args: {
    monitorId: v.string(),
    url: v.string(),
    status: v.string(),
    changeSummary: v.string(),
    contentHash: v.optional(v.string()),
    markdownPreview: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const source = await ctx.db
      .query("sources")
      .withIndex("by_monitor", (q) => q.eq("monitorId", args.monitorId))
      .unique();

    if (!source) {
      return null;
    }

    if (args.status === "changed" && args.contentHash && args.markdownPreview) {
      await ctx.db.insert("sourceSnapshots", {
        sourceId: source._id,
        projectId: source.projectId,
        retrievedAt: Date.now(),
        title: source.label,
        contentHash: args.contentHash,
        markdownPreview: args.markdownPreview,
        storageId: args.storageId,
        changeStatus: "changed",
      });

      await ctx.db.patch("sources", source._id, {
        lastScrapedAt: Date.now(),
        lastChangedAt: Date.now(),
        healthStatus: "current",
      });

      await ctx.runMutation(internal.requirements.reevaluateFromSourceChange, {
        projectId: source.projectId,
        sourceId: source._id,
        changeSummary: args.changeSummary,
      });
    }

    await appendEvent(
      ctx,
      source.projectId,
      "source.monitor",
      `Monitor event for ${source.label}: ${args.status}. ${args.changeSummary}`,
      { actorType: "source", actorLabel: source.label },
    );

    return null;
  },
});
