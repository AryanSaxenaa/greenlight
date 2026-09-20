"use node";

import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";
import {
  buildClarificationDraftPrompt,
  buildDocumentFactsPrompt,
  buildInboundEmailPrompt,
  buildRequirementsExtractionPrompt,
} from "../lib/aiPrompts";
import { generateStructuredWithGateway, formatAiError } from "../lib/aiGateway";
import {
  CLARIFICATION_DRAFT_JSON_EXAMPLE,
  DOCUMENT_FACTS_JSON_EXAMPLE,
  INBOUND_EMAIL_JSON_EXAMPLE,
  REQUIREMENTS_JSON_EXAMPLE,
} from "../lib/aiExamples";
import {
  clarificationDraftSchema,
  documentFactsSchema,
  GREENLIGHT_AI_MODEL,
  inboundEmailSchema,
  requirementsExtractionSchema,
} from "../lib/aiSchemas";
import { parseInboundEmail } from "../lib/emailParsing";
import {
  baseRequirements,
  dedupeRequirements,
  extractRequirementsFromMarkdown,
  type ExtractedRequirement,
} from "../lib/requirementExtraction";
import { extractFactsFromText } from "../lib/documentExtraction";

export const extractRequirementsWithAI = internalAction({
  args: { projectId: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.runQuery(internal.projects.getInternal, {
      projectId: args.projectId,
    });
    if (!project) {
      return null;
    }

    const sourceBundle = await ctx.runQuery(internal.sources.bundleForExtractionInternal, {
      projectId: args.projectId,
    });

    let aiRequirements: ExtractedRequirement[] = [];
    let aiUsed = false;

    if (sourceBundle.sources.length > 0) {
      try {
        const { data: object } = await generateStructuredWithGateway({
          schema: requirementsExtractionSchema,
          jsonExample: REQUIREMENTS_JSON_EXAMPLE,
          prompt: buildRequirementsExtractionPrompt({
            projectIntent: project.intent,
            address: project.normalizedAddress ?? project.address,
            sources: sourceBundle.sources,
          }),
        });

        aiRequirements = object.requirements;
        aiUsed = true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown AI error";
        await ctx.runMutation(internal.projects.appendEventInternal, {
          projectId: args.projectId,
          type: "ai.extraction_fallback",
          message: `OpenAI extraction failed, using deterministic fallback: ${message}`,
          actorType: "agent",
          actorLabel: "OpenAI via Convex AI Gateway",
        });
      }
    }

    const regexRequirements: ExtractedRequirement[] = [...baseRequirements()];
    for (const source of sourceBundle.sources) {
      regexRequirements.push(
        ...extractRequirementsFromMarkdown(source.markdown, source.key),
      );
    }

    const merged = dedupeRequirements([
      ...baseRequirements(),
      ...aiRequirements,
      ...regexRequirements.filter(
        (row) => !baseRequirements().some((base) => base.nodeKey === row.nodeKey),
      ),
    ]);

    await ctx.runMutation(internal.requirements.applyExtractedInternal, {
      projectId: args.projectId,
      requirements: merged,
      aiUsed,
    });

    await ctx.runMutation(internal.projects.completeCompilationAfterRequirements, {
      projectId: args.projectId,
    });

    return null;
  },
});

export const parseInboundEmailWithAI = internalAction({
  args: {
    projectId: v.id("projects"),
    providerMessageId: v.optional(v.string()),
    threadId: v.optional(v.string()),
    fromAddress: v.optional(v.string()),
    toAddresses: v.array(v.string()),
    subject: v.string(),
    body: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const requirements = await ctx.runQuery(internal.requirements.listInternal, {
      projectId: args.projectId,
    });

    let parsed = parseInboundEmail(args.subject, args.body, requirements);
    let aiUsed = false;

    try {
      const { data: object } = await generateStructuredWithGateway({
        schema: inboundEmailSchema,
        jsonExample: INBOUND_EMAIL_JSON_EXAMPLE,
        prompt: buildInboundEmailPrompt({
          subject: args.subject,
          body: args.body,
          requirements: requirements.map((requirement) => ({
            nodeKey: requirement.nodeKey,
            title: requirement.title,
            category: requirement.category,
          })),
        }),
      });

      const linkedRequirement = object.linkedRequirementNodeKey
        ? requirements.find((item) => item.nodeKey === object.linkedRequirementNodeKey)
        : undefined;

      parsed = {
        classification: object.classification,
        detectedDecision: object.detectedDecision,
        projectImpact: object.projectImpact,
        actionRequired: object.actionRequired,
        linkedRequirementId: linkedRequirement?._id ?? parsed.linkedRequirementId,
        extractions:
          object.extractions.length > 0
            ? object.extractions
            : parsed.extractions,
      };
      aiUsed = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown AI error";
      await ctx.runMutation(internal.projects.appendEventInternal, {
        projectId: args.projectId,
        type: "ai.email_fallback",
        message: `OpenAI email parsing failed, using deterministic fallback: ${message}`,
        actorType: "agent",
        actorLabel: "OpenAI via Convex AI Gateway",
      });
    }

    await ctx.runMutation(internal.communications.recordInboundInternal, {
      projectId: args.projectId,
      providerMessageId: args.providerMessageId,
      threadId: args.threadId,
      fromAddress: args.fromAddress,
      toAddresses: args.toAddresses,
      subject: args.subject,
      body: args.body,
      linkedRequirementId: parsed.linkedRequirementId,
      classification: parsed.classification,
      detectedDecision: parsed.detectedDecision,
      projectImpact: parsed.projectImpact,
      actionRequired: parsed.actionRequired,
      extractions: parsed.extractions.map((extraction) => ({
        extractionType: extraction.extractionType,
        value: extraction.value,
        confidence: extraction.confidence,
        linkedRequirementIds: parsed.linkedRequirementId ? [parsed.linkedRequirementId] : [],
      })),
    });

    await ctx.runMutation(internal.projects.appendEventInternal, {
      projectId: args.projectId,
      type: aiUsed ? "ai.email_parsed" : "email.received",
      message: parsed.linkedRequirementId
        ? `Inbound agency message linked to a requirement: ${args.subject}`
        : `Inbound agency message received: ${args.subject}`,
      actorType: "agency",
      actorLabel: args.fromAddress ?? "Agency",
    });

    return null;
  },
});

export const draftClarificationWithAI = internalAction({
  args: {
    projectId: v.id("projects"),
    requirementId: v.id("requirements"),
    toAddresses: v.array(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const bundle = await ctx.runQuery(internal.approvals.draftContextInternal, {
      projectId: args.projectId,
      requirementId: args.requirementId,
      toAddresses: args.toAddresses,
    });

    if (!bundle) {
      return null;
    }

    let subject = `Clarification request: ${bundle.requirement.title}`;
    let body = "";
    let factsUsed = bundle.factsUsed;
    let aiUsed = false;

    try {
      const { data: object } = await generateStructuredWithGateway({
        schema: clarificationDraftSchema,
        jsonExample: CLARIFICATION_DRAFT_JSON_EXAMPLE,
        prompt: buildClarificationDraftPrompt({
          projectIntent: bundle.project.intent,
          address: bundle.project.normalizedAddress ?? bundle.project.address,
          jurisdiction: bundle.project.jurisdiction ?? "Los Angeles",
          requirementTitle: bundle.requirement.title,
          requirementReason:
            bundle.requirement.blockedReason ??
            bundle.requirement.sourceExcerpt ??
            "Applicability needs confirmation.",
          sourceExcerpt: bundle.requirement.sourceExcerpt,
          parameters: bundle.parameters,
          recipientEmail: args.toAddresses[0] ?? "",
        }),
      });

      subject = object.subject;
      body = object.body;
      factsUsed = object.factsUsed;
      aiUsed = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown AI error";
      await ctx.runMutation(internal.projects.appendEventInternal, {
        projectId: args.projectId,
        type: "ai.draft_fallback",
        message: `OpenAI draft generation failed, using template fallback: ${message}`,
        actorType: "agent",
        actorLabel: "OpenAI via Convex AI Gateway",
      });
      subject = bundle.templateSubject;
      body = bundle.templateBody;
      factsUsed = bundle.factsUsed;
    }

    await ctx.runMutation(internal.approvals.createDraftInternal, {
      projectId: args.projectId,
      requirementId: args.requirementId,
      subject,
      body,
      toAddresses: args.toAddresses,
      factsUsed,
      aiUsed,
    });

    return null;
  },
});

export const extractDocumentFactsWithAI = internalAction({
  args: { documentId: v.id("documents") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const document = await ctx.runQuery(internal.documents.getInternal, {
      documentId: args.documentId,
    });
    if (!document) {
      return null;
    }

    const runId = await ctx.runMutation(internal.agentRuns.startInternal, {
      projectId: document.projectId,
      actionType: "extract_document_facts",
      trigger: "document_upload",
      message: `Extracting facts from ${document.filename} with OpenAI.`,
    });

    const blob = await ctx.storage.get(document.storageId);
    if (!blob) {
      await ctx.runMutation(internal.agentRuns.completeInternal, {
        runId,
        message: "Document blob missing.",
        failed: true,
      });
      return null;
    }

    let text = "";
    if (
      document.mimeType.startsWith("text/") ||
      document.mimeType === "application/json" ||
      document.filename.endsWith(".txt") ||
      document.filename.endsWith(".csv")
    ) {
      text = await blob.text();
    } else {
      const bytes = new Uint8Array(await blob.arrayBuffer());
      text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
      if (text.length < 32) {
        text = `${document.filename}\n${document.documentType}`;
      }
    }

    let facts = extractFactsFromText(text, document.documentType, document.filename);
    let aiUsed = false;

    try {
      const { data: object } = await generateStructuredWithGateway({
        schema: documentFactsSchema,
        jsonExample: DOCUMENT_FACTS_JSON_EXAMPLE,
        prompt: buildDocumentFactsPrompt({
          filename: document.filename,
          documentType: document.documentType,
          text,
        }),
      });

      if (object.facts.length > 0) {
        facts = object.facts;
        aiUsed = true;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown AI error";
      await ctx.runMutation(internal.projects.appendEventInternal, {
        projectId: document.projectId,
        type: "ai.document_fallback",
        message: `OpenAI document extraction failed, using deterministic fallback: ${message}`,
        actorType: "agent",
        actorLabel: "OpenAI via Convex AI Gateway",
      });
    }

    const nodeKeys = requirementNodeKeysForDocumentType(document.documentType);

    await ctx.runMutation(internal.documents.applyExtractionInternal, {
      documentId: args.documentId,
      projectId: document.projectId,
      facts,
      nodeKeys,
    });

    await ctx.runMutation(internal.agentRuns.completeInternal, {
      runId,
      message: aiUsed
        ? `OpenAI extracted ${facts.length} facts.`
        : `Extracted ${facts.length} facts.`,
    });

    return null;
  },
});

function requirementNodeKeysForDocumentType(documentType: string): string[] {
  switch (documentType) {
    case "site_plan":
      return ["site_plan"];
    case "structural":
      return ["structural"];
    case "survey":
      return ["property", "site_plan"];
    case "title_report":
      return ["property", "zoning"];
    case "existing_plans":
      return ["property", "site_plan"];
    default:
      return [];
  }
}

export const testAiGateway = internalAction({
  args: {},
  returns: v.object({
    ok: v.boolean(),
    model: v.string(),
    mode: v.optional(v.string()),
    sampleTitle: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async () => {
    try {
      const structured = await generateStructuredWithGateway({
        schema: requirementsExtractionSchema,
        jsonExample: REQUIREMENTS_JSON_EXAMPLE,
        prompt: [
          "Extract one Los Angeles ADU permit requirement from this excerpt:",
          "Detached ADUs must maintain a rear setback of at least 4 feet from the property line.",
        ].join("\n"),
      });

      return {
        ok: structured.data.requirements.length > 0,
        model: GREENLIGHT_AI_MODEL,
        mode: structured.mode,
        sampleTitle: structured.data.requirements[0]?.title,
      };
    } catch (error) {
      const message = formatAiError(error);
      console.error("AI gateway structured test failed", message);
      return {
        ok: false,
        model: GREENLIGHT_AI_MODEL,
        error: message,
      };
    }
  },
});
