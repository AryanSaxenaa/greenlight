import { v } from "convex/values";
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
        changeStatus: "changed",
      });

      await ctx.db.patch("sources", source._id, {
        lastScrapedAt: Date.now(),
      });
    }

    if (args.status === "changed") {
      const requirements = await ctx.db
        .query("requirements")
        .withIndex("by_project", (q) => q.eq("projectId", source.projectId))
        .collect();

      const affected = requirements.filter(
        (requirement) => requirement.sourceId === source._id,
      );

      for (const requirement of affected) {
        await ctx.db.patch("requirements", requirement._id, {
          status: "review",
          blockedReason: `Official source changed: ${args.changeSummary}`,
          isPrimaryBlocker:
            requirement.isPrimaryBlocker || requirement.category === "setback",
        });
      }
    }

    await appendEvent(
      ctx,
      source.projectId,
      "source.monitor",
      `Monitor event for ${source.label}: ${args.status}. ${args.changeSummary}`,
    );

    return null;
  },
});
