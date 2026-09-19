"use node";

import { createHash } from "crypto";
import { Firecrawl } from "firecrawl";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";

export const scrapeProjectSources = internalAction({
  args: { projectId: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    const client = apiKey ? new Firecrawl({ apiKey }) : new Firecrawl();

    const { sources } = await ctx.runQuery(internal.sources.listInternal, {
      projectId: args.projectId,
    });

    for (const source of sources) {
      try {
        const result = await client.scrape(source.url, {
          formats: ["markdown"],
        });

        const markdown = result.markdown ?? "";
        const preview = markdown.slice(0, 1200);
        const contentHash = createHash("sha256").update(markdown).digest("hex");
        const title =
          typeof result.metadata?.title === "string"
            ? result.metadata.title
            : source.label;

        await ctx.runMutation(internal.sources.storeSnapshot, {
          sourceId: source._id,
          projectId: args.projectId,
          title,
          contentHash,
          markdownPreview: preview,
          changeStatus: "retrieved",
        });

        await ctx.runMutation(internal.projects.appendEventInternal, {
          projectId: args.projectId,
          type: "source.scraped",
          message: `Retrieved official source: ${source.label}.`,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown scrape error";
        await ctx.runMutation(internal.projects.appendEventInternal, {
          projectId: args.projectId,
          type: "source.scrape_failed",
          message: `Failed to retrieve ${source.label}: ${message}`,
        });
      }
    }

    return null;
  },
});
