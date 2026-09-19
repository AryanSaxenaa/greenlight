import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const requirementStatus = v.union(
  v.literal("verified"),
  v.literal("blocked"),
  v.literal("review"),
  v.literal("missing"),
  v.literal("locked"),
);

const compilerStageStatus = v.union(
  v.literal("waiting"),
  v.literal("running"),
  v.literal("complete"),
);

const projectStatus = v.union(
  v.literal("draft"),
  v.literal("compiling"),
  v.literal("active"),
  v.literal("archived"),
);

export default defineSchema({
  projects: defineTable({
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
    status: projectStatus,
    permitPathStages: v.number(),
    requirementCount: v.number(),
    blockerCount: v.number(),
    unknownCount: v.number(),
    nextAction: v.optional(v.string()),
    primaryBlocker: v.optional(v.string()),
    primaryBlockerReason: v.optional(v.string()),
    primaryBlockerSource: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_status", ["status", "updatedAt"]),

  compilerStages: defineTable({
    projectId: v.id("projects"),
    stageKey: v.string(),
    label: v.string(),
    order: v.number(),
    status: compilerStageStatus,
  }).index("by_project", ["projectId", "order"]),

  requirements: defineTable({
    projectId: v.id("projects"),
    title: v.string(),
    category: v.string(),
    status: requirementStatus,
    authority: v.optional(v.string()),
    sourceLabel: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
    evidenceRequired: v.optional(v.string()),
    blockedReason: v.optional(v.string()),
    sortOrder: v.number(),
    isPrimaryBlocker: v.boolean(),
  })
    .index("by_project", ["projectId", "sortOrder"])
    .index("by_project_and_status", ["projectId", "status"]),

  projectEvents: defineTable({
    projectId: v.id("projects"),
    type: v.string(),
    message: v.string(),
    createdAt: v.number(),
  }).index("by_project", ["projectId", "createdAt"]),
});
