import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, requireProjectAccess } from "./lib/auth";
import { appendEvent, seedCompilerStages } from "./lib/compiler";

const projectStatusValidator = v.union(
  v.literal("draft"),
  v.literal("compiling"),
  v.literal("active"),
  v.literal("archived"),
);

const projectSummaryValidator = v.object({
  _id: v.id("projects"),
  _creationTime: v.number(),
  userId: v.id("users"),
  title: v.string(),
  intent: v.string(),
  address: v.string(),
  normalizedAddress: v.optional(v.string()),
  jurisdiction: v.optional(v.string()),
  city: v.optional(v.string()),
  county: v.optional(v.string()),
  state: v.optional(v.string()),
  parcelId: v.optional(v.string()),
  zoning: v.optional(v.string()),
  readinessPercent: v.number(),
  status: projectStatusValidator,
  permitPathStages: v.number(),
  requirementCount: v.number(),
  blockerCount: v.number(),
  unknownCount: v.number(),
  nextAction: v.optional(v.string()),
  primaryBlocker: v.optional(v.string()),
  primaryBlockerReason: v.optional(v.string()),
  primaryBlockerSource: v.optional(v.string()),
  inboxId: v.optional(v.string()),
  inboxEmail: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

const compilerStageValidator = v.object({
  _id: v.id("compilerStages"),
  _creationTime: v.number(),
  projectId: v.id("projects"),
  stageKey: v.string(),
  label: v.string(),
  order: v.number(),
  status: v.union(
    v.literal("waiting"),
    v.literal("running"),
    v.literal("complete"),
  ),
});

const requirementValidator = v.object({
  _id: v.id("requirements"),
  _creationTime: v.number(),
  projectId: v.id("projects"),
  title: v.string(),
  category: v.string(),
  status: v.union(
    v.literal("verified"),
    v.literal("blocked"),
    v.literal("review"),
    v.literal("missing"),
    v.literal("locked"),
  ),
  authority: v.optional(v.string()),
  sourceLabel: v.optional(v.string()),
  sourceUrl: v.optional(v.string()),
  sourceId: v.optional(v.id("sources")),
  evidenceRequired: v.optional(v.string()),
  blockedReason: v.optional(v.string()),
  sortOrder: v.number(),
  isPrimaryBlocker: v.boolean(),
});

const eventValidator = v.object({
  _id: v.id("projectEvents"),
  _creationTime: v.number(),
  projectId: v.id("projects"),
  type: v.string(),
  message: v.string(),
  createdAt: v.number(),
});

function deriveTitle(intent: string, address: string): string {
  const trimmedIntent = intent.trim();
  if (trimmedIntent.length > 0) {
    return trimmedIntent.length > 72
      ? `${trimmedIntent.slice(0, 69)}...`
      : trimmedIntent;
  }
  return address.trim();
}

function parseLosAngelesJurisdiction(address: string) {
  const normalized = address.trim();
  const lower = normalized.toLowerCase();
  const inLosAngeles =
    lower.includes("los angeles") || lower.includes(", la ");

  if (!inLosAngeles) {
    return {
      jurisdiction: undefined,
      city: undefined,
      county: undefined,
      state: undefined,
    };
  }

  return {
    jurisdiction: "City of Los Angeles",
    city: "Los Angeles",
    county: "Los Angeles County",
    state: "California",
  };
}

export const list = query({
  args: {},
  returns: v.array(projectSummaryValidator),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);
    return projects;
  },
});

export const get = query({
  args: { projectId: v.id("projects") },
  returns: v.union(
    v.object({
      project: projectSummaryValidator,
      stages: v.array(compilerStageValidator),
      requirements: v.array(requirementValidator),
      events: v.array(eventValidator),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const { project } = await requireProjectAccess(ctx, args.projectId);

    const stages = await ctx.db
      .query("compilerStages")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const requirements = await ctx.db
      .query("requirements")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const events = await ctx.db
      .query("projectEvents")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(40);

    return { project, stages, requirements, events };
  },
});

export const create = mutation({
  args: {
    intent: v.string(),
    address: v.string(),
  },
  returns: v.id("projects"),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const intent = args.intent.trim();
    const address = args.address.trim();

    if (intent.length < 8) {
      throw new Error("Describe your project in at least 8 characters.");
    }
    if (address.length < 5) {
      throw new Error("Enter a valid property address.");
    }

    const now = Date.now();
    const jurisdictionInfo = parseLosAngelesJurisdiction(address);
    const title = deriveTitle(intent, address);

    const projectId = await ctx.db.insert("projects", {
      userId: user._id,
      title,
      intent,
      address,
      normalizedAddress: address,
      jurisdiction: jurisdictionInfo.jurisdiction,
      city: jurisdictionInfo.city,
      county: jurisdictionInfo.county,
      state: jurisdictionInfo.state,
      readinessPercent: 0,
      status: "compiling",
      permitPathStages: 0,
      requirementCount: 0,
      blockerCount: 0,
      unknownCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    await seedCompilerStages(ctx, projectId);
    await appendEvent(ctx, projectId, "project.created", "Project created.");
    await appendEvent(
      ctx,
      projectId,
      "compiler.started",
      "Compiler run queued for property resolution.",
    );

    await ctx.scheduler.runAfter(0, internal.integrations.agentmailActions.provisionProjectInbox, {
      projectId,
    });
    await ctx.scheduler.runAfter(0, internal.projects.runCompiler, { projectId });

    return projectId;
  },
});

export const getInternal = internalQuery({
  args: { projectId: v.id("projects") },
  returns: v.union(projectSummaryValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get("projects", args.projectId);
  },
});

export const getByInboxInternal = internalQuery({
  args: { inboxId: v.string() },
  returns: v.union(projectSummaryValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projects")
      .withIndex("by_inbox", (q) => q.eq("inboxId", args.inboxId))
      .unique();
  },
});

export const setInboxInternal = internalMutation({
  args: {
    projectId: v.id("projects"),
    inboxId: v.string(),
    inboxEmail: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch("projects", args.projectId, {
      inboxId: args.inboxId,
      inboxEmail: args.inboxEmail,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const appendEventInternal = internalMutation({
  args: {
    projectId: v.id("projects"),
    type: v.string(),
    message: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await appendEvent(ctx, args.projectId, args.type, args.message);
    return null;
  },
});

export const runCompiler = internalMutation({
  args: { projectId: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get("projects", args.projectId);
    if (!project || project.status !== "compiling") {
      return null;
    }

    const stages = await ctx.db
      .query("compilerStages")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const orderedStages = [...stages].sort((a, b) => a.order - b.order);
    let resolvedJurisdiction = project.jurisdiction;

    for (const stage of orderedStages) {
      await ctx.db.patch("compilerStages", stage._id, { status: "running" });
      await appendEvent(
        ctx,
        args.projectId,
        "compiler.stage",
        `${stage.label} running.`,
      );

      if (stage.stageKey === "jurisdiction") {
        const jurisdictionInfo = parseLosAngelesJurisdiction(project.address);
        resolvedJurisdiction = jurisdictionInfo.jurisdiction;
        await ctx.db.patch("projects", args.projectId, {
          ...jurisdictionInfo,
          normalizedAddress: project.address,
          updatedAt: Date.now(),
        });
        if (jurisdictionInfo.jurisdiction) {
          await appendEvent(
            ctx,
            args.projectId,
            "jurisdiction.resolved",
            `Jurisdiction resolved to ${jurisdictionInfo.jurisdiction}.`,
          );
        } else {
          await appendEvent(
            ctx,
            args.projectId,
            "jurisdiction.pending",
            "Jurisdiction not yet supported. Los Angeles addresses resolve automatically.",
          );
        }
      }

      if (stage.stageKey === "authority_sources" && resolvedJurisdiction) {
        await ctx.runMutation(internal.sources.seedOfficialSources, {
          projectId: args.projectId,
        });
        await ctx.scheduler.runAfter(
          0,
          internal.integrations.firecrawlActions.scrapeProjectSources,
          { projectId: args.projectId },
        );
      }

      if (stage.stageKey === "dependency_graph" && resolvedJurisdiction) {
        await appendEvent(
          ctx,
          args.projectId,
          "compiler.stage",
          "Dependency graph waits for official source retrieval.",
        );
      }

      await ctx.db.patch("compilerStages", stage._id, { status: "complete" });
      await appendEvent(
        ctx,
        args.projectId,
        "compiler.stage",
        `${stage.label} complete.`,
      );
    }

    return null;
  },
});

export const completeCompilation = internalMutation({
  args: { projectId: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get("projects", args.projectId);
    if (!project || project.status !== "compiling") {
      return null;
    }

    await ctx.runMutation(internal.requirements.applyFromSnapshots, {
      projectId: args.projectId,
    });
    await finalizeProject(ctx, args.projectId);
    return null;
  },
});

async function finalizeProject(ctx: MutationCtx, projectId: Id<"projects">) {
  const requirements = await ctx.db
    .query("requirements")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .collect();

  const blockerCount = requirements.filter((r) => r.status === "blocked").length;
  const reviewCount = requirements.filter((r) => r.status === "review").length;
  const missingCount = requirements.filter((r) => r.status === "missing").length;
  const verifiedCount = requirements.filter((r) => r.status === "verified").length;
  const total = requirements.length;
  const readinessPercent =
    total === 0 ? 0 : Math.round((verifiedCount / total) * 100);

  const primary = requirements.find((r) => r.isPrimaryBlocker);

  await ctx.db.patch("projects", projectId, {
    status: "active",
    readinessPercent,
    permitPathStages: 4,
    requirementCount: total,
    blockerCount,
    unknownCount: reviewCount,
    nextAction:
      missingCount > 0
        ? "Upload missing evidence for open requirements."
        : "Review primary blocker and draft agency clarification.",
    primaryBlocker: primary?.title,
    primaryBlockerReason: primary?.blockedReason,
    primaryBlockerSource: primary?.sourceLabel,
    updatedAt: Date.now(),
  });

  await appendEvent(
    ctx,
    projectId,
    "compiler.complete",
    `Project compiled. Readiness ${readinessPercent}%.`,
  );

  if (primary) {
    await ctx.db.insert("approvals", {
      projectId,
      actionType: "send_clarification_email",
      subject: `Clarification request: ${primary.title}`,
      body: [
        "Hello Planning Department,",
        "",
        `We are preparing a residential ADU project and need clarification on ${primary.title.toLowerCase()}.`,
        "",
        primary.blockedReason ?? "Please confirm the applicable requirement for this site.",
        "",
        "Thank you,",
        "Greenlight project team",
      ].join("\n"),
      toAddresses: ["planning.correspondence@lacity.org"],
      requirementId: primary._id,
      status: "pending",
      requestedAt: Date.now(),
    });

    await appendEvent(
      ctx,
      projectId,
      "approval.requested",
      "Draft clarification email prepared for human approval.",
    );
  }
}
