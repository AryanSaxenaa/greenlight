import { authTables } from "@convex-dev/auth/server";
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

const communicationDirection = v.union(
  v.literal("inbound"),
  v.literal("outbound"),
);

const approvalStatus = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected"),
  v.literal("sent"),
);

export default defineSchema({
  ...authTables,

  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    createdAt: v.optional(v.number()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  projects: defineTable({
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
    status: projectStatus,
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
  })
    .index("by_user", ["userId", "updatedAt"])
    .index("by_status", ["status", "updatedAt"])
    .index("by_inbox", ["inboxId"]),

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
    sourceId: v.optional(v.id("sources")),
    evidenceRequired: v.optional(v.string()),
    blockedReason: v.optional(v.string()),
    sortOrder: v.number(),
    isPrimaryBlocker: v.boolean(),
  })
    .index("by_project", ["projectId", "sortOrder"])
    .index("by_project_and_status", ["projectId", "status"]),

  sources: defineTable({
    projectId: v.id("projects"),
    key: v.string(),
    url: v.string(),
    authority: v.string(),
    label: v.string(),
    sourceType: v.string(),
    official: v.boolean(),
    monitorId: v.optional(v.string()),
    lastScrapedAt: v.optional(v.number()),
  }).index("by_project", ["projectId", "key"]),

  sourceSnapshots: defineTable({
    sourceId: v.id("sources"),
    projectId: v.id("projects"),
    retrievedAt: v.number(),
    title: v.optional(v.string()),
    contentHash: v.string(),
    markdownPreview: v.string(),
    storageId: v.optional(v.id("_storage")),
    changeStatus: v.optional(v.string()),
  }).index("by_source", ["sourceId", "retrievedAt"]),

  documents: defineTable({
    projectId: v.id("projects"),
    storageId: v.id("_storage"),
    filename: v.string(),
    mimeType: v.string(),
    documentType: v.string(),
    uploadedBy: v.id("users"),
    createdAt: v.number(),
  }).index("by_project", ["projectId", "createdAt"]),

  communications: defineTable({
    projectId: v.id("projects"),
    direction: communicationDirection,
    providerMessageId: v.optional(v.string()),
    threadId: v.optional(v.string()),
    fromAddress: v.optional(v.string()),
    toAddresses: v.array(v.string()),
    subject: v.string(),
    body: v.string(),
    status: v.string(),
    linkedRequirementId: v.optional(v.id("requirements")),
    receivedAt: v.number(),
  }).index("by_project", ["projectId", "receivedAt"]),

  approvals: defineTable({
    projectId: v.id("projects"),
    actionType: v.string(),
    subject: v.string(),
    body: v.string(),
    toAddresses: v.array(v.string()),
    requirementId: v.optional(v.id("requirements")),
    status: approvalStatus,
    requestedAt: v.number(),
    resolvedAt: v.optional(v.number()),
    resolvedBy: v.optional(v.id("users")),
    providerMessageId: v.optional(v.string()),
  }).index("by_project_and_status", ["projectId", "status"]),

  projectEvents: defineTable({
    projectId: v.id("projects"),
    type: v.string(),
    message: v.string(),
    createdAt: v.number(),
  }).index("by_project", ["projectId", "createdAt"]),
});
