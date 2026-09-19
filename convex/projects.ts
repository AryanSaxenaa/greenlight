import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, requireProjectAccess } from "./lib/auth";
import {
  appendEvent,
  recomputeProjectMetrics,
  runStage,
  seedCompilerStages,
  setStageStatus,
} from "./lib/compiler";
import { buildClarificationDraft } from "./lib/draftEmail";
import { resolveJurisdiction, validateSupportedAddress } from "./lib/jurisdiction";

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
  sourcesDiscovered: v.number(),
  sourcesRetrieved: v.number(),
  rulesExtracted: v.number(),
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
  nodeKey: v.string(),
  title: v.string(),
  category: v.string(),
  status: v.union(
    v.literal("verified"),
    v.literal("blocked"),
    v.literal("review"),
    v.literal("missing"),
    v.literal("locked"),
  ),
  verificationStatus: v.union(
    v.literal("known"),
    v.literal("unverified"),
    v.literal("unknown"),
    v.literal("conflicted"),
  ),
  authority: v.optional(v.string()),
  sourceLabel: v.optional(v.string()),
  sourceUrl: v.optional(v.string()),
  sourceId: v.optional(v.id("sources")),
  sourceExcerpt: v.optional(v.string()),
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
  actorType: v.union(
    v.literal("user"),
    v.literal("agent"),
    v.literal("agency"),
    v.literal("source"),
    v.literal("system"),
  ),
  actorLabel: v.optional(v.string()),
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
      .take(50);

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

    const addressError = validateSupportedAddress(address);
    if (addressError) {
      throw new Error(addressError);
    }

    const now = Date.now();
    const resolution = resolveJurisdiction(address);
    const title = deriveTitle(intent, address);

    const projectId = await ctx.db.insert("projects", {
      userId: user._id,
      title,
      intent,
      address,
      normalizedAddress: resolution.normalizedAddress,
      jurisdiction: resolution.jurisdiction,
      city: resolution.city,
      county: resolution.county,
      state: resolution.state,
      parcelId: resolution.parcelId,
      zoning: resolution.zoning,
      readinessPercent: 0,
      status: "compiling",
      permitPathStages: 0,
      requirementCount: 0,
      blockerCount: 0,
      unknownCount: 0,
      sourcesDiscovered: 0,
      sourcesRetrieved: 0,
      rulesExtracted: 0,
      createdAt: now,
      updatedAt: now,
    });

    await seedCompilerStages(ctx, projectId);
    await appendEvent(
      ctx,
      projectId,
      "project.created",
      "Project created.",
      { actorType: "user", actorLabel: user.email ?? "User" },
    );
    await appendEvent(
      ctx,
      projectId,
      "compiler.started",
      "Compiler run queued for property resolution.",
      { actorType: "agent", actorLabel: "Compiler" },
    );

    await seedDefaultParameters(ctx, projectId, intent);

    await ctx.scheduler.runAfter(0, internal.integrations.agentmailActions.provisionProjectInbox, {
      projectId,
    });
    await ctx.scheduler.runAfter(0, internal.projects.runCompiler, { projectId });

    return projectId;
  },
});

async function seedDefaultParameters(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  intent: string,
) {
  const defaults = [
    { key: "proposedAduHeightFt", value: "16", unit: "ft", source: "user_intent" },
    {
      key: "projectType",
      value: /garage/i.test(intent) ? "garage_conversion_adu" : "adu",
      unit: undefined,
      source: "user_intent",
    },
  ];

  for (const parameter of defaults) {
    await ctx.db.insert("projectParameters", {
      projectId,
      key: parameter.key,
      value: parameter.value,
      unit: parameter.unit,
      source: parameter.source,
      verificationStatus: "unverified",
      updatedAt: Date.now(),
    });
  }
}

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
    actorType: v.optional(
      v.union(
        v.literal("user"),
        v.literal("agent"),
        v.literal("agency"),
        v.literal("source"),
        v.literal("system"),
      ),
    ),
    actorLabel: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await appendEvent(ctx, args.projectId, args.type, args.message, {
      actorType: args.actorType ?? "system",
      actorLabel: args.actorLabel,
    });
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

    await runStage(ctx, args.projectId, "jurisdiction", "Jurisdiction", async () => {
      const resolution = resolveJurisdiction(project.address);
      await ctx.db.patch("projects", args.projectId, {
        normalizedAddress: resolution.normalizedAddress,
        jurisdiction: resolution.jurisdiction,
        city: resolution.city,
        county: resolution.county,
        state: resolution.state,
        parcelId: resolution.parcelId,
        zoning: resolution.zoning,
        updatedAt: Date.now(),
      });

      if (resolution.supported) {
        await appendEvent(
          ctx,
          args.projectId,
          "jurisdiction.resolved",
          resolution.message,
          { actorType: "agent", actorLabel: "Jurisdiction resolver" },
        );
      } else {
        await appendEvent(
          ctx,
          args.projectId,
          "jurisdiction.pending",
          resolution.message,
          { actorType: "system", actorLabel: "Greenlight" },
        );
      }
    });

    const updated = await ctx.db.get("projects", args.projectId);
    if (!updated?.jurisdiction) {
      await finalizeUnsupportedProject(ctx, args.projectId);
      return null;
    }

    await setStageStatus(ctx, args.projectId, "authority_sources", "running");
    await ctx.runMutation(internal.sources.seedOfficialSources, {
      projectId: args.projectId,
    });
    await ctx.scheduler.runAfter(
      0,
      internal.integrations.firecrawlActions.scrapeProjectSources,
      { projectId: args.projectId },
    );

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

    await runStage(
      ctx,
      args.projectId,
      "authority_sources",
      "Authority sources",
      async () => undefined,
    );

    await runStage(
      ctx,
      args.projectId,
      "project_classification",
      "Project classification",
      async () => {
        await appendEvent(
          ctx,
          args.projectId,
          "project.classified",
          `Classified as ${project.intent.includes("garage") ? "garage conversion ADU" : "residential ADU"}.`,
          { actorType: "agent", actorLabel: "Classifier" },
        );
      },
    );

    await runStage(
      ctx,
      args.projectId,
      "applicable_regulations",
      "Applicable regulations",
      async () => {
        await ctx.runMutation(internal.requirements.applyFromSnapshots, {
          projectId: args.projectId,
        });
      },
    );

    await runStage(ctx, args.projectId, "permit_pathway", "Permit pathway", async () => {
      await ctx.db.patch("projects", args.projectId, {
        permitPathStages: 4,
        updatedAt: Date.now(),
      });
    });

    await runStage(
      ctx,
      args.projectId,
      "evidence_requirements",
      "Evidence requirements",
      async () => {
        await appendEvent(
          ctx,
          args.projectId,
          "evidence.mapped",
          "Evidence requirements linked to permit pathway.",
          { actorType: "agent", actorLabel: "Evidence mapper" },
        );
      },
    );

    await runStage(ctx, args.projectId, "dependency_graph", "Dependency graph", async () => {
      await ctx.runMutation(internal.requirements.seedDependencies, {
        projectId: args.projectId,
      });
    });

    await finalizeProject(ctx, args.projectId);
    return null;
  },
});

async function finalizeUnsupportedProject(
  ctx: MutationCtx,
  projectId: Id<"projects">,
) {
  const waitingStages = [
    "authority_sources",
    "project_classification",
    "applicable_regulations",
    "permit_pathway",
    "evidence_requirements",
    "dependency_graph",
  ];

  for (const stageKey of waitingStages) {
    await setStageStatus(ctx, projectId, stageKey, "complete");
  }

  await ctx.db.patch("projects", projectId, {
    status: "active",
    readinessPercent: 0,
    nextAction: "This jurisdiction is not supported yet. Los Angeles addresses are supported.",
    updatedAt: Date.now(),
  });

  await appendEvent(
    ctx,
    projectId,
    "compiler.complete",
    "Compilation halted: unsupported jurisdiction.",
    { actorType: "system", actorLabel: "Greenlight" },
  );
}

async function finalizeProject(ctx: MutationCtx, projectId: Id<"projects">) {
  await recomputeProjectMetrics(ctx, projectId);

  const project = await ctx.db.get("projects", projectId);
  if (!project) {
    return;
  }

  await ctx.db.patch("projects", projectId, {
    status: "active",
    permitPathStages: 4,
    updatedAt: Date.now(),
  });

  const refreshed = await ctx.db.get("projects", projectId);

  await appendEvent(
    ctx,
    projectId,
    "compiler.complete",
    `Project compiled. Readiness ${refreshed?.readinessPercent ?? 0}%.`,
    { actorType: "agent", actorLabel: "Compiler" },
  );

  const requirements = await ctx.db
    .query("requirements")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .collect();

  const primary =
    requirements.find((requirement) => requirement.isPrimaryBlocker) ??
    requirements.find((requirement) => requirement.status === "blocked");

  if (!primary) {
    return;
  }

  const parameters = await ctx.db
    .query("projectParameters")
    .withIndex("by_project_and_key", (q) => q.eq("projectId", projectId))
    .collect();

  const owner = await ctx.db.get("users", project.userId);
  const recipientEmail = owner?.email ?? project.inboxEmail;

  if (!recipientEmail) {
    return;
  }

  const draft = buildClarificationDraft({
    project,
    requirement: primary,
    parameters,
    recipientEmail,
  });

  await ctx.db.insert("approvals", {
    projectId,
    actionType: "send_clarification_email",
    subject: draft.subject,
    body: draft.body,
    toAddresses: draft.toAddresses,
    factsUsed: draft.factsUsed,
    requirementId: primary._id,
    status: "pending",
    requestedAt: Date.now(),
  });

  await appendEvent(
    ctx,
    projectId,
    "approval.requested",
    "Draft clarification email prepared for human approval.",
    { actorType: "agent", actorLabel: "Correspondence drafter" },
  );
}
