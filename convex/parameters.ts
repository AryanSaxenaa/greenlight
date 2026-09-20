import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, requireProjectAccess } from "./lib/auth";
import { appendEvent, recomputeProjectMetrics } from "./lib/compiler";
import { completeAgentRun, startAgentRun } from "./lib/agentRuns";

const parameterValidator = v.object({
  _id: v.id("projectParameters"),
  _creationTime: v.number(),
  projectId: v.id("projects"),
  key: v.string(),
  value: v.string(),
  unit: v.optional(v.string()),
  source: v.string(),
  verificationStatus: v.union(
    v.literal("known"),
    v.literal("unverified"),
    v.literal("unknown"),
    v.literal("conflicted"),
  ),
  updatedAt: v.number(),
});

const changeSetValidator = v.object({
  _id: v.id("changeSets"),
  _creationTime: v.number(),
  projectId: v.id("projects"),
  parameterKey: v.string(),
  previousValue: v.string(),
  proposedValue: v.string(),
  status: v.union(v.literal("pending"), v.literal("applied"), v.literal("rejected")),
  requirementsChanged: v.number(),
  requirementsInvalidated: v.number(),
  documentsAffected: v.number(),
  blockerCreated: v.optional(v.string()),
  affectedRequirementIds: v.array(v.id("requirements")),
  affectedDocumentIds: v.array(v.id("documents")),
  createdAt: v.number(),
  appliedAt: v.optional(v.number()),
});

export const listForProject = query({
  args: { projectId: v.id("projects") },
  returns: v.array(parameterValidator),
  handler: async (ctx, args) => {
    await requireProjectAccess(ctx, args.projectId);
    return await ctx.db
      .query("projectParameters")
      .withIndex("by_project_and_key", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

export const listPendingChanges = query({
  args: { projectId: v.id("projects") },
  returns: v.array(changeSetValidator),
  handler: async (ctx, args) => {
    await requireProjectAccess(ctx, args.projectId);
    return await ctx.db
      .query("changeSets")
      .withIndex("by_project_and_status", (q) =>
        q.eq("projectId", args.projectId).eq("status", "pending"),
      )
      .collect();
  },
});

export const seedDefaults = mutation({
  args: { projectId: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireProjectAccess(ctx, args.projectId);

    const defaults = [
      { key: "proposedAduHeightFt", value: "16", unit: "ft", source: "user_intent" },
      { key: "projectType", value: "garage_conversion_adu", unit: undefined, source: "user_intent" },
    ];

    for (const parameter of defaults) {
      const existing = await ctx.db
        .query("projectParameters")
        .withIndex("by_project_and_key", (q) =>
          q.eq("projectId", args.projectId).eq("key", parameter.key),
        )
        .unique();

      if (!existing) {
        await ctx.db.insert("projectParameters", {
          projectId: args.projectId,
          key: parameter.key,
          value: parameter.value,
          unit: parameter.unit,
          source: parameter.source,
          verificationStatus: "unverified",
          updatedAt: Date.now(),
        });
      }
    }

    return null;
  },
});

export const proposeChange = mutation({
  args: {
    projectId: v.id("projects"),
    parameterKey: v.string(),
    proposedValue: v.string(),
  },
  returns: v.id("changeSets"),
  handler: async (ctx, args) => {
    const { user, project } = await requireProjectAccess(ctx, args.projectId);

    const current = await ctx.db
      .query("projectParameters")
      .withIndex("by_project_and_key", (q) =>
        q.eq("projectId", args.projectId).eq("key", args.parameterKey),
      )
      .unique();

    const previousValue = current?.value ?? "";
    if (previousValue === args.proposedValue) {
      throw new Error("Proposed value matches the current value.");
    }

    const requirements = await ctx.db
      .query("requirements")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const affectedRequirementIds: Array<typeof requirements[number]["_id"]> = [];
    const affectedDocumentIds: Array<typeof documents[number]["_id"]> = [];
    let requirementsInvalidated = 0;
    let blockerCreated: string | undefined;

    if (args.parameterKey === "proposedAduHeightFt") {
      const proposed = Number.parseFloat(args.proposedValue);
      const previous = Number.parseFloat(previousValue);
      if (Number.isFinite(proposed) && Number.isFinite(previous) && proposed > previous) {
        const height = requirements.find((item) => item.nodeKey === "height");
        const setback = requirements.find((item) => item.nodeKey === "setback");
        const sitePlan = requirements.find((item) => item.nodeKey === "site_plan");

        if (height) {
          affectedRequirementIds.push(height._id);
        }
        if (setback) {
          affectedRequirementIds.push(setback._id);
          requirementsInvalidated += 1;
          blockerCreated = "Rear-setback exemption may no longer apply.";
        }
        if (sitePlan) {
          affectedRequirementIds.push(sitePlan._id);
        }

        for (const document of documents) {
          if (document.documentType === "site_plan" || document.documentType === "existing_plans") {
            affectedDocumentIds.push(document._id);
          }
        }
      }
    }

    const changeSetId = await ctx.db.insert("changeSets", {
      projectId: args.projectId,
      parameterKey: args.parameterKey,
      previousValue,
      proposedValue: args.proposedValue,
      status: "pending",
      requirementsChanged: affectedRequirementIds.length,
      requirementsInvalidated,
      documentsAffected: affectedDocumentIds.length,
      blockerCreated,
      affectedRequirementIds,
      affectedDocumentIds,
      createdAt: Date.now(),
    });

    await appendEvent(
      ctx,
      args.projectId,
      "change.proposed",
      `Proposed ${args.parameterKey}: ${previousValue} → ${args.proposedValue}.`,
      { actorType: "user", actorLabel: user.email ?? "User" },
    );

    await ctx.db.patch("projects", project._id, {
      nextAction: "Review proposed change impact before applying.",
      updatedAt: Date.now(),
    });

    return changeSetId;
  },
});

export const applyChange = mutation({
  args: { changeSetId: v.id("changeSets") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const changeSet = await ctx.db.get("changeSets", args.changeSetId);
    if (!changeSet || changeSet.status !== "pending") {
      throw new Error("Change set not found or already resolved.");
    }

    await requireProjectAccess(ctx, changeSet.projectId);

    const runId = await startAgentRun(
      ctx,
      changeSet.projectId,
      "generate_change_impact",
      "user_change",
      `Applying ${changeSet.parameterKey} change.`,
    );

    const parameter = await ctx.db
      .query("projectParameters")
      .withIndex("by_project_and_key", (q) =>
        q.eq("projectId", changeSet.projectId).eq("key", changeSet.parameterKey),
      )
      .unique();

    if (parameter) {
      await ctx.db.patch("projectParameters", parameter._id, {
        value: changeSet.proposedValue,
        verificationStatus: "unverified",
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("projectParameters", {
        projectId: changeSet.projectId,
        key: changeSet.parameterKey,
        value: changeSet.proposedValue,
        source: "user_change",
        verificationStatus: "unverified",
        updatedAt: Date.now(),
      });
    }

    for (const requirementId of changeSet.affectedRequirementIds) {
      const requirement = await ctx.db.get("requirements", requirementId);
      if (!requirement) {
        continue;
      }

      await ctx.db.patch("requirements", requirementId, {
        status: requirement.nodeKey === "setback" ? "blocked" : "review",
        verificationStatus: "unverified",
        isPrimaryBlocker: requirement.nodeKey === "setback",
        blockedReason:
          changeSet.blockerCreated ??
          `Recompiled after ${changeSet.parameterKey} changed to ${changeSet.proposedValue}.`,
      });
    }

    await ctx.db.patch("changeSets", args.changeSetId, {
      status: "applied",
      appliedAt: Date.now(),
    });

    await recomputeProjectMetrics(ctx, changeSet.projectId);

    await appendEvent(
      ctx,
      changeSet.projectId,
      "change.applied",
      `Applied ${changeSet.parameterKey}: ${changeSet.previousValue} → ${changeSet.proposedValue}.`,
      { actorType: "user", actorLabel: user.email ?? "User" },
    );

    await completeAgentRun(ctx, runId, "Change impact applied.");
    return null;
  },
});

export const rejectChange = mutation({
  args: { changeSetId: v.id("changeSets") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const changeSet = await ctx.db.get("changeSets", args.changeSetId);
    if (!changeSet || changeSet.status !== "pending") {
      throw new Error("Change set not found or already resolved.");
    }

    await requireProjectAccess(ctx, changeSet.projectId);
    await ctx.db.patch("changeSets", args.changeSetId, { status: "rejected" });
    await appendEvent(
      ctx,
      changeSet.projectId,
      "change.rejected",
      `Rejected proposed ${changeSet.parameterKey} change.`,
      { actorType: "user", actorLabel: user.email ?? "User" },
    );
    return null;
  },
});
