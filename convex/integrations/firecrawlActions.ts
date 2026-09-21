"use node";

import { createHash } from "crypto";
import { Firecrawl } from "firecrawl";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";
import { isGenericPlanningHomepage, LADBS_ADU_REFERENCE_MARKDOWN, normalizeSourceUrl } from "../lib/sources";
export const scrapeProjectSources = internalAction({
  args: { projectId: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    const client = apiKey ? new Firecrawl({ apiKey }) : new Firecrawl();
    const siteUrl = process.env.CONVEX_SITE_URL ?? process.env.PUBLIC_SITE_URL;
    const webhookSecret = process.env.FIRECRAWL_WEBHOOK_SECRET;

    const runId = await ctx.runMutation(internal.agentRuns.startInternal, {
      projectId: args.projectId,
      actionType: "crawl_sources",
      trigger: "compiler",
      message: "Crawling official LA permitting sources.",
    });

    await ctx.runQuery(internal.sources.listInternal, {
      projectId: args.projectId,
    });

    let retrievedCount = 0;

    try {
      if (apiKey) {
        try {
          const crawl = await client.crawl("https://planning.lacity.gov/plans-policies/initiatives-policies/accessory-dwelling-units", {
            limit: 5,
            scrapeOptions: { formats: ["markdown"] },
          });

          for (const page of crawl.data ?? []) {
            const url = page.metadata?.sourceURL ?? page.metadata?.url;
            if (!url || typeof url !== "string") {
              continue;
            }
            const normalizedUrl = normalizeSourceUrl(url);
            if (
              normalizedUrl.endsWith("planning.lacity.gov") ||
              normalizedUrl.endsWith("planning.lacity.gov/")
            ) {
              continue;
            }
            const slug = url.split("/").filter(Boolean).pop() ?? "page";
            await ctx.runMutation(internal.sources.addDiscoveredSource, {
              projectId: args.projectId,
              key: `discovered_${slug}`,
              url,
              label: typeof page.metadata?.title === "string" ? page.metadata.title : slug,
              authority: "City Planning",
            });
          }
        } catch {
          // Discovery is best-effort; seeded sources still scrape below.
        }
      }

      const refreshed = await ctx.runQuery(internal.sources.listInternal, {
        projectId: args.projectId,
      });

      for (const source of refreshed.sources) {
        try {
          const result = await client.scrape(source.url, {
            formats: ["markdown"],
          });

          const markdown = result.markdown ?? "";
          const preview = markdown.slice(0, 8000);
          const contentHash = createHash("sha256").update(markdown).digest("hex");
          const title =
            typeof result.metadata?.title === "string"
              ? result.metadata.title
              : source.label;

          if (
            source.key === "planning_adu" &&
            isGenericPlanningHomepage({
              url: source.url,
              title,
              markdownPreview: preview,
            })
          ) {
            await ctx.runMutation(internal.sources.markUnreachable, {
              sourceId: source._id,
            });
            await ctx.runMutation(internal.projects.appendEventInternal, {
              projectId: args.projectId,
              type: "source.scrape_failed",
              message: `${source.label} returned a generic planning homepage instead of ADU guidance.`,
              actorType: "agent",
              actorLabel: "Firecrawl",
            });
            continue;
          }

          const storageId = markdown
            ? await ctx.storage.store(new Blob([markdown], { type: "text/markdown" }))
            : undefined;

          await ctx.runMutation(internal.sources.storeSnapshot, {
            sourceId: source._id,
            projectId: args.projectId,
            title,
            contentHash,
            markdownPreview: preview,
            storageId,
            changeStatus: "retrieved",
          });

          retrievedCount += 1;

          await ctx.runMutation(internal.projects.appendEventInternal, {
            projectId: args.projectId,
            type: "source.scraped",
            message: `Retrieved official source: ${source.label}.`,
            actorType: "agent",
            actorLabel: "Firecrawl",
          });

          if (
            apiKey &&
            siteUrl &&
            source.key === "planning_adu" &&
            !source.monitorId
          ) {
            const monitor = await client.createMonitor({
              name: `greenlight-${args.projectId}-${source.key}`,
              schedule: { text: "daily" },
              webhook: {
                url: webhookSecret
                  ? `${siteUrl}/webhooks/firecrawl?secret=${encodeURIComponent(webhookSecret)}`
                  : `${siteUrl}/webhooks/firecrawl`,
                metadata: {
                  projectId: args.projectId,
                  sourceKey: source.key,
                },
              },
              targets: [
                {
                  type: "scrape",
                  urls: [source.url],
                  scrapeOptions: { formats: ["markdown"] },
                },
              ],
              goal: "Detect meaningful changes to Los Angeles ADU ordinance guidance.",
              judgeEnabled: true,
            });

            await ctx.runMutation(internal.sources.setMonitorInternal, {
              sourceId: source._id,
              monitorId: monitor.id,
            });

            await ctx.runMutation(internal.projects.appendEventInternal, {
              projectId: args.projectId,
              type: "source.monitor",
              message: `Monitoring enabled for ${source.label}.`,
              actorType: "agent",
              actorLabel: "Firecrawl monitor",
            });
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown scrape error";

          if (source.key === "ladbs_adu") {
            const preview = LADBS_ADU_REFERENCE_MARKDOWN.slice(0, 8000);
            const contentHash = createHash("sha256").update(preview).digest("hex");
            const storageId = await ctx.storage.store(
              new Blob([LADBS_ADU_REFERENCE_MARKDOWN], { type: "text/markdown" }),
            );

            await ctx.runMutation(internal.sources.storeSnapshot, {
              sourceId: source._id,
              projectId: args.projectId,
              title: "LADBS ADU permitting (reference)",
              contentHash,
              markdownPreview: preview,
              storageId,
              changeStatus: "reference_fallback",
            });

            retrievedCount += 1;

            await ctx.runMutation(internal.projects.appendEventInternal, {
              projectId: args.projectId,
              type: "source.scraped",
              message: `${source.label}: live scrape blocked (${message.slice(0, 120)}); stored official ADU reference excerpt.`,
              actorType: "agent",
              actorLabel: "Firecrawl",
            });
            continue;
          }

          await ctx.runMutation(internal.sources.markUnreachable, {
            sourceId: source._id,
          });
          await ctx.runMutation(internal.projects.appendEventInternal, {
            projectId: args.projectId,
            type: "source.scrape_failed",
            message: `Failed to retrieve ${source.label}: ${message}`,
            actorType: "agent",
            actorLabel: "Firecrawl",
          });
        }
      }

      await ctx.runMutation(internal.agentRuns.completeInternal, {
        runId,
        message: `Retrieved ${retrievedCount} official sources.`,
        failed: retrievedCount === 0,
      });
    } finally {
      await ctx.runMutation(internal.projects.completeCompilation, {
        projectId: args.projectId,
      });
    }

    return null;
  },
});

export const rescrapeMonitoredSource = internalAction({
  args: {
    monitorId: v.string(),
    changeSummary: v.string(),
    diffText: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    const client = apiKey ? new Firecrawl({ apiKey }) : new Firecrawl();

    const source = await ctx.runQuery(internal.sources.getByMonitorInternal, {
      monitorId: args.monitorId,
    });
    if (!source) {
      return null;
    }

    try {
      const result = await client.scrape(source.url, { formats: ["markdown"] });
      const markdown = result.markdown ?? args.diffText;
      const preview = markdown.slice(0, 8000);
      const contentHash = createHash("sha256").update(markdown).digest("hex");
      const storageId = markdown
        ? await ctx.storage.store(new Blob([markdown], { type: "text/markdown" }))
        : undefined;

      await ctx.runMutation(internal.integrations.firecrawlWebhook.processMonitorPage, {
        monitorId: args.monitorId,
        url: source.url,
        status: "changed",
        changeSummary: args.changeSummary,
        contentHash,
        markdownPreview: preview,
        storageId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown scrape error";
      await ctx.runMutation(internal.projects.appendEventInternal, {
        projectId: source.projectId,
        type: "source.rescrape_failed",
        message: `Failed to refresh ${source.label}: ${message}`,
        actorType: "agent",
        actorLabel: "Firecrawl",
      });
    }

    return null;
  },
});
