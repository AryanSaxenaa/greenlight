import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, requireProjectAccess } from "./lib/auth";
import { appendEvent } from "./lib/compiler";

const documentValidator = v.object({
  _id: v.id("documents"),
  _creationTime: v.number(),
  projectId: v.id("projects"),
  storageId: v.id("_storage"),
  filename: v.string(),
  mimeType: v.string(),
  documentType: v.string(),
  uploadedBy: v.id("users"),
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
    );

    const requirements = await ctx.db
      .query("requirements")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const sitePlan = requirements.find((r) => r.category === "site_plan");
    if (sitePlan && args.documentType === "site_plan") {
      await ctx.db.patch("requirements", sitePlan._id, {
        status: "review",
      });
    }

    await ctx.db.patch("projects", project._id, {
      nextAction: "Review uploaded evidence against open requirements.",
      updatedAt: Date.now(),
    });

    return documentId;
  },
});
