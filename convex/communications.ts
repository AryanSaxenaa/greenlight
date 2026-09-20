import { internalMutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";
import { requireProjectAccess } from "./lib/auth";
import { appendEvent, recomputeProjectMetrics } from "./lib/compiler";

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
  deliveryStatus: v.optional(v.string()),
  classification: v.optional(v.string()),
  detectedDecision: v.optional(v.string()),
  projectImpact: v.optional(v.string()),
  linkedRequirementId: v.optional(v.id("requirements")),
  receivedAt: v.number(),
});

const extractionValidator = v.object({
  _id: v.id("communicationExtractions"),
  _creationTime: v.number(),
  projectId: v.id("projects"),
  communicationId: v.id("communications"),
  extractionType: v.string(),
  value: v.string(),
  linkedRequirementIds: v.array(v.id("requirements")),
  confidence: v.number(),
  createdAt: v.number(),
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

export const listInternal = internalQuery({
  args: { projectId: v.id("projects") },
  returns: v.array(communicationValidator),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("communications")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();
  },
});

export const findByProviderMessageInternal = internalQuery({
  args: {
    projectId: v.id("projects"),
    providerMessageId: v.string(),
  },
  returns: v.union(communicationValidator, v.null()),
  handler: async (ctx, args) => {
    const communications = await ctx.db
      .query("communications")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(100);

    return (
      communications.find(
        (communication) =>
          communication.providerMessageId === args.providerMessageId,
      ) ?? null
    );
  },
});

export const listExtractionsForProject = query({
  args: { projectId: v.id("projects") },
  returns: v.array(extractionValidator),
  handler: async (ctx, args) => {
    await requireProjectAccess(ctx, args.projectId);
    const communications = await ctx.db
      .query("communications")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const extractions = [];
    for (const communication of communications) {
      const rows = await ctx.db
        .query("communicationExtractions")
        .withIndex("by_communication", (q) =>
          q.eq("communicationId", communication._id),
        )
        .collect();
      extractions.push(...rows);
    }
    return extractions;
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
    classification: v.optional(v.string()),
    detectedDecision: v.optional(v.string()),
    projectImpact: v.optional(v.string()),
    actionRequired: v.optional(v.string()),
    extractions: v.optional(
      v.array(
        v.object({
          extractionType: v.string(),
          value: v.string(),
          confidence: v.number(),
          linkedRequirementIds: v.array(v.id("requirements")),
        }),
      ),
    ),
  },
  returns: v.id("communications"),
  handler: async (ctx, args) => {
    if (args.providerMessageId) {
      const recentCommunications = await ctx.db
        .query("communications")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .order("desc")
        .take(100);

      const duplicate = recentCommunications.find(
        (communication) =>
          communication.providerMessageId === args.providerMessageId,
      );

      if (duplicate) {
        return duplicate._id;
      }
    }

    const communicationId = await ctx.db.insert("communications", {
      projectId: args.projectId,
      direction: "inbound",
      providerMessageId: args.providerMessageId,
      threadId: args.threadId,
      fromAddress: args.fromAddress,
      toAddresses: args.toAddresses,
      subject: args.subject,
      body: args.body,
      status: "received",
      deliveryStatus: "delivered",
      classification: args.classification,
      detectedDecision: args.detectedDecision,
      projectImpact: args.projectImpact,
      linkedRequirementId: args.linkedRequirementId,
      receivedAt: Date.now(),
    });

    for (const extraction of args.extractions ?? []) {
      await ctx.db.insert("communicationExtractions", {
        communicationId,
        projectId: args.projectId,
        extractionType: extraction.extractionType,
        value: extraction.value,
        linkedRequirementIds: extraction.linkedRequirementIds,
        confidence: extraction.confidence,
        createdAt: Date.now(),
      });
    }

    if (args.linkedRequirementId) {
      const requirement = await ctx.db.get("requirements", args.linkedRequirementId);
      if (requirement && requirement.projectId === args.projectId) {
        await ctx.db.patch("requirements", args.linkedRequirementId, {
          status: "review",
          verificationStatus: "unverified",
          blockedReason: args.actionRequired ?? args.projectImpact,
        });
      }
    }

    await recomputeProjectMetrics(ctx, args.projectId);

    await appendEvent(
      ctx,
      args.projectId,
      "email.parsed",
      args.actionRequired ?? "Inbound agency message parsed.",
      { actorType: "agency", actorLabel: args.fromAddress ?? "Agency" },
    );

    return communicationId;
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
    deliveryStatus: v.optional(v.string()),
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
      deliveryStatus: args.deliveryStatus ?? "sent",
      linkedRequirementId: args.requirementId,
      receivedAt: Date.now(),
    });
  },
});
