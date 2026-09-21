"use node";

import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { DEMO_SITE_PLAN, DEMO_STRUCTURAL } from "./lib/demoAssets";

export const applyDemoBundleInternal = internalAction({
  args: {
    projectId: v.id("projects"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const siteStorageId = await ctx.storage.store(
      new Blob([DEMO_SITE_PLAN], { type: "text/plain" }),
    );
    const structuralStorageId = await ctx.storage.store(
      new Blob([DEMO_STRUCTURAL], { type: "text/plain" }),
    );

    await ctx.runMutation(internal.documents.ingestDemoDocumentInternal, {
      projectId: args.projectId,
      userId: args.userId,
      storageId: siteStorageId,
      filename: "site-plan-garage-adu-detailed.txt",
      mimeType: "text/plain",
      documentType: "site_plan",
      textContent: DEMO_SITE_PLAN,
    });

    await ctx.runMutation(internal.documents.ingestDemoDocumentInternal, {
      projectId: args.projectId,
      userId: args.userId,
      storageId: structuralStorageId,
      filename: "structural-calcs-garage-adu.txt",
      mimeType: "text/plain",
      documentType: "structural",
      textContent: DEMO_STRUCTURAL,
    });

    try {
      await ctx.runAction(internal.integrations.agentmailActions.provisionProjectInbox, {
        projectId: args.projectId,
      });
    } catch (error) {
      console.warn(
        "Demo bundle: AgentMail inbox provisioning skipped:",
        error instanceof Error ? error.message : error,
      );
    }

    const requirements = await ctx.runQuery(internal.requirements.listInternal, {
      projectId: args.projectId,
    });
    const parking = requirements.find((item) => item.nodeKey === "parking");
    if (parking) {
      await ctx.runAction(internal.integrations.openaiActions.draftClarificationWithAI, {
        projectId: args.projectId,
        requirementId: parking._id,
        toAddresses: ["planning@lacity.org"],
      });
    }

    await ctx.runMutation(internal.projects.recordDemoBundleEventInternal, {
      projectId: args.projectId,
    });

    return null;
  },
});
