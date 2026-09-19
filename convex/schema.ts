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

const verificationStatus = v.union(
  v.literal("known"),
  v.literal("unverified"),
  v.literal("unknown"),
  v.literal("conflicted"),
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

const actorType = v.union(
  v.literal("user"),
  v.literal("agent"),
  v.literal("agency"),
  v.literal("source"),
  v.literal("system"),
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
    nodeKey: v.string(),
    title: v.string(),
    category: v.string(),
    status: requirementStatus,
    verificationStatus: verificationStatus,
    authority: v.optional(v.string()),
    sourceLabel: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
    sourceId: v.optional(v.id("sources")),
    sourceExcerpt: v.optional(v.string()),
    evidenceRequired: v.optional(v.string()),
    blockedReason: v.optional(v.string()),
    sortOrder: v.number(),
    isPrimaryBlocker: v.boolean(),
  })
    .index("by_project", ["projectId", "sortOrder"])
    .index("by_project_and_status", ["projectId", "status"])
    .index("by_project_and_node", ["projectId", "nodeKey"]),

  dependencies: defineTable({
    projectId: v.id("projects"),
    fromNodeKey: v.string(),
    toNodeKey: v.string(),
    relationship: v.string(),
  }).index("by_project", ["projectId"]),

  projectParameters: defineTable({
    projectId: v.id("projects"),
    key: v.string(),
    value: v.string(),
    unit: v.optional(v.string()),
    source: v.string(),
    verificationStatus: verificationStatus,
    updatedAt: v.number(),
  }).index("by_project_and_key", ["projectId", "key"]),

  changeSets: defineTable({
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
  }).index("by_project_and_status", ["projectId", "status"]),

  sources: defineTable({
    projectId: v.id("projects"),
    key: v.string(),
    url: v.string(),
    authority: v.string(),
    label: v.string(),
    sourceType: v.string(),
    official: v.boolean(),
    monitorId: v.optional(v.string()),
    healthStatus: v.optional(
      v.union(v.literal("current"), v.literal("stale"), v.literal("unreachable")),
    ),
    lastScrapedAt: v.optional(v.number()),
    lastChangedAt: v.optional(v.number()),
  })
    .index("by_project", ["projectId", "key"])
    .index("by_monitor", ["monitorId"]),

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
    extractedFacts: v.optional(
      v.array(
        v.object({
          label: v.string(),
          value: v.string(),
          confidence: v.optional(v.number()),
        }),
      ),
    ),
    createdAt: v.number(),
  }).index("by_project", ["projectId", "createdAt"]),

  evidenceLinks: defineTable({
    projectId: v.id("projects"),
    documentId: v.id("documents"),
    requirementId: v.id("requirements"),
    fact: v.string(),
    confidence: v.number(),
    createdAt: v.number(),
  })
    .index("by_project", ["projectId", "createdAt"])
    .index("by_requirement", ["requirementId"]),

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
    deliveryStatus: v.optional(v.string()),
    classification: v.optional(v.string()),
    detectedDecision: v.optional(v.string()),
    projectImpact: v.optional(v.string()),
    linkedRequirementId: v.optional(v.id("requirements")),
    receivedAt: v.number(),
  }).index("by_project", ["projectId", "receivedAt"]),

  communicationExtractions: defineTable({
    communicationId: v.id("communications"),
    projectId: v.id("projects"),
    extractionType: v.string(),
    value: v.string(),
    linkedRequirementIds: v.array(v.id("requirements")),
    confidence: v.number(),
    createdAt: v.number(),
  }).index("by_communication", ["communicationId"]),

  approvals: defineTable({
    projectId: v.id("projects"),
    actionType: v.string(),
    subject: v.string(),
    body: v.string(),
    toAddresses: v.array(v.string()),
    factsUsed: v.optional(v.array(v.string())),
    requirementId: v.optional(v.id("requirements")),
    status: approvalStatus,
    requestedAt: v.number(),
    resolvedAt: v.optional(v.number()),
    resolvedBy: v.optional(v.id("users")),
    providerMessageId: v.optional(v.string()),
  }).index("by_project_and_status", ["projectId", "status"]),

  agentRuns: defineTable({
    projectId: v.id("projects"),
    actionType: v.string(),
    trigger: v.string(),
    status: v.union(
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    message: v.string(),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_project", ["projectId", "startedAt"]),

  projectEvents: defineTable({
    projectId: v.id("projects"),
    type: v.string(),
    message: v.string(),
    actorType: actorType,
    actorLabel: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_project", ["projectId", "createdAt"]),
});
