import { internal } from "./_generated/api";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, requireProjectAccess } from "./lib/auth";
import { appendEvent } from "./lib/compiler";
import { buildClarificationDraft } from "./lib/draftEmail";

const approvalValidator = v.object({
  _id: v.id("approvals"),
  _creationTime: v.number(),
  projectId: v.id("projects"),
  actionType: v.string(),
  subject: v.string(),
  body: v.string(),
  toAddresses: v.array(v.string()),
  factsUsed: v.optional(v.array(v.string())),
  requirementId: v.optional(v.id("requirements")),
  status: v.union(
    v.literal("pending"),
    v.literal("approved"),
    v.literal("rejected"),
    v.literal("sent"),
  ),
  requestedAt: v.number(),
  resolvedAt: v.optional(v.number()),
  resolvedBy: v.optional(v.id("users")),
  providerMessageId: v.optional(v.string()),
});

export const listPending = query({
  args: { projectId: v.id("projects") },
  returns: v.array(approvalValidator),
  handler: async (ctx, args) => {
    await requireProjectAccess(ctx, args.projectId);
    const approvals = await ctx.db
      .query("approvals")
      .withIndex("by_project_and_status", (q) =>
        q.eq("projectId", args.projectId).eq("status", "pending"),
      )
      .collect();
    return approvals;
  },
});

export const createClarificationDraft = mutation({
  args: {
    projectId: v.id("projects"),
    requirementId: v.id("requirements"),
    toAddresses: v.array(v.string()),
  },
  returns: v.id("approvals"),
  handler: async (ctx, args) => {
    const { user, project } = await requireProjectAccess(ctx, args.projectId);
    const requirement = await ctx.db.get("requirements", args.requirementId);
    if (!requirement) {
      throw new Error("Requirement not found");
    }

    const parameters = await ctx.db
      .query("projectParameters")
      .withIndex("by_project_and_key", (q) => q.eq("projectId", args.projectId))
      .collect();

    const draft = buildClarificationDraft({
      project,
      requirement,
      parameters,
      recipientEmail: args.toAddresses[0],
    });

    const approvalId = await ctx.db.insert("approvals", {
      projectId: args.projectId,
      actionType: "send_clarification_email",
      subject: draft.subject,
      body: draft.body,
      toAddresses: args.toAddresses,
      factsUsed: draft.factsUsed,
      requirementId: args.requirementId,
      status: "pending",
      requestedAt: Date.now(),
    });

    await appendEvent(
      ctx,
      args.projectId,
      "approval.requested",
      `Draft clarification ready for review: ${draft.subject}`,
      { actorType: "user", actorLabel: user.email ?? "User" },
    );

    return approvalId;
  },
});

export const approve = mutation({
  args: { approvalId: v.id("approvals") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const approval = await ctx.db.get("approvals", args.approvalId);
    if (!approval) {
      throw new Error("Approval not found");
    }

    await requireProjectAccess(ctx, approval.projectId);

    if (approval.status !== "pending") {
      throw new Error("Approval is no longer pending");
    }

    await ctx.db.patch("approvals", args.approvalId, {
      status: "approved",
      resolvedAt: Date.now(),
      resolvedBy: user._id,
    });

    await appendEvent(
      ctx,
      approval.projectId,
      "approval.approved",
      `Approved outbound email: ${approval.subject}`,
      { actorType: "user", actorLabel: user.email ?? "User" },
    );

    await ctx.scheduler.runAfter(
      0,
      internal.integrations.agentmailActions.sendApprovedEmail,
      { approvalId: args.approvalId },
    );

    return null;
  },
});

export const reject = mutation({
  args: { approvalId: v.id("approvals") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const approval = await ctx.db.get("approvals", args.approvalId);
    if (!approval) {
      throw new Error("Approval not found");
    }

    await requireProjectAccess(ctx, approval.projectId);

    await ctx.db.patch("approvals", args.approvalId, {
      status: "rejected",
      resolvedAt: Date.now(),
      resolvedBy: user._id,
    });

    await appendEvent(
      ctx,
      approval.projectId,
      "approval.rejected",
      `Rejected outbound email: ${approval.subject}`,
      { actorType: "user", actorLabel: user.email ?? "User" },
    );

    return null;
  },
});

export const getInternal = internalQuery({
  args: { approvalId: v.id("approvals") },
  returns: v.union(approvalValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get("approvals", args.approvalId);
  },
});

export const markSentInternal = internalMutation({
  args: {
    approvalId: v.id("approvals"),
    providerMessageId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch("approvals", args.approvalId, {
      status: "sent",
      providerMessageId: args.providerMessageId,
    });
    return null;
  },
});
