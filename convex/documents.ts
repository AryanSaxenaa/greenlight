import { internal } from "./_generated/api";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, requireProjectAccess } from "./lib/auth";
import { appendEvent, recomputeProjectMetrics } from "./lib/compiler";

const factValidator = v.object({
  label: v.string(),
  value: v.string(),
  confidence: v.optional(v.number()),
});

const documentValidator = v.object({
  _id: v.id("documents"),
  _creationTime: v.number(),
  projectId: v.id("projects"),
  storageId: v.id("_storage"),
  filename: v.string(),
  mimeType: v.string(),
  documentType: v.string(),
  uploadedBy: v.id("users"),
  extractedFacts: v.optional(v.array(factValidator)),
  createdAt: v.number(),
});

const evidenceLinkValidator = v.object({
  _id: v.id("evidenceLinks"),
  _creationTime: v.number(),
  projectId: v.id("projects"),
  documentId: v.id("documents"),
  requirementId: v.id("requirements"),
  fact: v.string(),
  confidence: v.number(),
  createdAt: v.number(),
});

export const listForProject = query({
  args: { projectId: v.id("projects") },
  returns: v.array(documentValidator),
  handler: async (ctx, args) => {
    await requireProjectAccess(ctx, args.projectId);
    return await ctx.db
      .query("documents")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();
  },
});

export const listEvidenceForProject = query({
  args: { projectId: v.id("projects") },
  returns: v.array(evidenceLinkValidator),
  handler: async (ctx, args) => {
    await requireProjectAccess(ctx, args.projectId);
    return await ctx.db
      .query("evidenceLinks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();
  },
});

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await getCurrentUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveUploaded = mutation({
  args: {
    projectId: v.id("projects"),
    storageId: v.id("_storage"),
    filename: v.string(),
    mimeType: v.string(),
    documentType: v.string(),
  },
  returns: v.id("documents"),
  handler: async (ctx, args) => {
    const { user, project } = await requireProjectAccess(ctx, args.projectId);

    const documentId = await ctx.db.insert("documents", {
      projectId: args.projectId,
      storageId: args.storageId,
      filename: args.filename,
      mimeType: args.mimeType,
      documentType: args.documentType,
      uploadedBy: user._id,
      createdAt: Date.now(),
    });

    await appendEvent(
      ctx,
      args.projectId,
      "document.uploaded",
      `Uploaded ${args.documentType}: ${args.filename}.`,
      { actorType: "user", actorLabel: user.email ?? "User" },
    );

    await ctx.db.patch("projects", project._id, {
      nextAction: "Extracting facts from uploaded evidence.",
      updatedAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.integrations.documentActions.extractFacts, {
      documentId,
    });

    return documentId;
  },
});

export const getInternal = internalQuery({
  args: { documentId: v.id("documents") },
  returns: v.union(documentValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get("documents", args.documentId);
  },
});

export const applyExtractionInternal = internalMutation({
  args: {
    documentId: v.id("documents"),
    projectId: v.id("projects"),
    facts: v.array(factValidator),
    nodeKeys: v.array(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch("documents", args.documentId, {
      extractedFacts: args.facts,
    });

    const requirements = await ctx.db
      .query("requirements")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    for (const nodeKey of args.nodeKeys) {
      const requirement = requirements.find((item) => item.nodeKey === nodeKey);
      if (!requirement) {
        continue;
      }

      for (const fact of args.facts) {
        await ctx.db.insert("evidenceLinks", {
          projectId: args.projectId,
          documentId: args.documentId,
          requirementId: requirement._id,
          fact: `${fact.label}: ${fact.value}`,
          confidence: fact.confidence ?? 0.8,
          createdAt: Date.now(),
        });
      }
    }

    for (const nodeKey of args.nodeKeys) {
      const requirement = requirements.find((item) => item.nodeKey === nodeKey);
      if (!requirement) {
        continue;
      }
      if (requirement.status === "missing") {
        await ctx.db.patch("requirements", requirement._id, {
          status: "review",
          verificationStatus: "unverified",
        });
      }
      if (nodeKey === "site_plan" && requirement.status === "review") {
        const evidence = await ctx.db
          .query("evidenceLinks")
          .withIndex("by_requirement", (q) => q.eq("requirementId", requirement._id))
          .take(2);
        if (evidence.length >= 2) {
          await ctx.db.patch("requirements", requirement._id, {
            status: "verified",
            verificationStatus: "known",
          });
        }
      }
    }

    await recomputeProjectMetrics(ctx, args.projectId);

    await appendEvent(
      ctx,
      args.projectId,
      "document.extracted",
      `Mapped ${args.facts.length} extracted facts to requirements.`,
      { actorType: "agent", actorLabel: "Document extractor" },
    );

    return null;
  },
});
