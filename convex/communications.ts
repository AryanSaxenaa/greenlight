import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireProjectAccess } from "./lib/auth";

const communicationValidator = v.object({
  _id: v.id("communications"),
  _creationTime: v.number(),
  projectId: v.id("projects"),
  direction: v.union(v.literal("inbound"), v.literal("outbound")),
  providerMessageId: v.optional(v.string()),
  threadId: v.optional(v.string()),
  fromAddress: v.optional(v.string()),
  toAddresses: v.array(v.string()),
  subject: v.string(),
  body: v.string(),
  status: v.string(),
  linkedRequirementId: v.optional(v.id("requirements")),
  receivedAt: v.number(),
});

export const listForProject = query({
  args: { projectId: v.id("projects") },
  returns: v.array(communicationValidator),
  handler: async (ctx, args) => {
    await requireProjectAccess(ctx, args.projectId);
    return await ctx.db
      .query("communications")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();
  },
});

export const recordInboundInternal = internalMutation({
  args: {
    projectId: v.id("projects"),
    providerMessageId: v.optional(v.string()),
    threadId: v.optional(v.string()),
    fromAddress: v.optional(v.string()),
    toAddresses: v.array(v.string()),
    subject: v.string(),
    body: v.string(),
    linkedRequirementId: v.optional(v.id("requirements")),
  },
  returns: v.id("communications"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("communications", {
      projectId: args.projectId,
      direction: "inbound",
      providerMessageId: args.providerMessageId,
      threadId: args.threadId,
      fromAddress: args.fromAddress,
      toAddresses: args.toAddresses,
      subject: args.subject,
      body: args.body,
      status: "received",
      linkedRequirementId: args.linkedRequirementId,
      receivedAt: Date.now(),
    });
  },
});

export const recordOutboundInternal = internalMutation({
  args: {
    projectId: v.id("projects"),
    subject: v.string(),
    body: v.string(),
    toAddresses: v.array(v.string()),
    providerMessageId: v.optional(v.string()),
    requirementId: v.optional(v.id("requirements")),
  },
  returns: v.id("communications"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("communications", {
      projectId: args.projectId,
      direction: "outbound",
      providerMessageId: args.providerMessageId,
      toAddresses: args.toAddresses,
      subject: args.subject,
      body: args.body,
      status: "sent",
      linkedRequirementId: args.requirementId,
      receivedAt: Date.now(),
    });
  },
});
