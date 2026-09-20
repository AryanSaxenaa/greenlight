"use node";

import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";
import { formatAiError, generateStructuredWithGateway } from "../lib/aiGateway";
import { REQUIREMENTS_JSON_EXAMPLE } from "../lib/aiExamples";
import { GREENLIGHT_AI_MODEL, requirementsExtractionSchema } from "../lib/aiSchemas";

const stepResult = v.object({
  name: v.string(),
  ok: v.boolean(),
  detail: v.string(),
  durationMs: v.number(),
});

export const runAggressiveSuite = internalAction({
  args: {
    gatewayIterations: v.optional(v.number()),
    runFullPipeline: v.optional(v.boolean()),
  },
  returns: v.object({
    ok: v.boolean(),
    model: v.string(),
    projectId: v.optional(v.id("projects")),
    steps: v.array(stepResult),
    passed: v.number(),
    failed: v.number(),
    totalDurationMs: v.number(),
  }),
  handler: async (ctx, args) => {
    const started = Date.now();
    const steps: Array<{
      name: string;
      ok: boolean;
      detail: string;
      durationMs: number;
    }> = [];

    const runStep = async (name: string, fn: () => Promise<string>) => {
      const stepStarted = Date.now();
      try {
        const detail = await fn();
        steps.push({
          name,
          ok: true,
          detail,
          durationMs: Date.now() - stepStarted,
        });
      } catch (error) {
        steps.push({
          name,
          ok: false,
          detail: formatAiError(error),
          durationMs: Date.now() - stepStarted,
        });
      }
    };

    const suffix = `${Date.now()}`;
    let projectId: string | undefined;
    let userId: string | undefined;
    let requirementId: string | undefined;

    const gatewayIterations = Math.min(Math.max(args.gatewayIterations ?? 3, 1), 5);

    for (let index = 0; index < gatewayIterations; index += 1) {
      await runStep(`gateway_smoke_${index + 1}`, async () => {
        const { data, mode } = await generateStructuredWithGateway({
          schema: requirementsExtractionSchema,
          jsonExample: REQUIREMENTS_JSON_EXAMPLE,
          prompt: `Extract ADU setback requirement variant ${index + 1} from: Rear setback must be 4 feet.`,
        });
        if (data.requirements.length === 0) {
          throw new Error("No requirements returned");
        }
        return `${mode} mode returned "${data.requirements[0]?.title ?? "requirement"}"`;
      });
    }

    await runStep("prepare_test_project", async () => {
      const fixture = await ctx.runMutation(internal.testing.fixtures.prepareAiTestProjectInternal, {
        suffix,
      });
      projectId = fixture.projectId;
      userId = fixture.userId;
      return fixture.reused
        ? `Reused project ${fixture.projectId}`
        : `Created project ${fixture.projectId}`;
    });

    if (!projectId) {
      return summarize(steps, started, undefined);
    }

    await runStep("reset_requirements", async () => {
      await ctx.runMutation(internal.testing.fixtures.resetRequirementsInternal, {
        projectId: projectId as never,
      });
      return "Cleared prior requirements and pending approvals";
    });

    if (args.runFullPipeline !== false) {
      await runStep("extract_requirements_with_ai", async () => {
        await ctx.runAction(internal.integrations.openaiActions.extractRequirementsWithAI, {
          projectId: projectId as never,
        });
        const requirements = await ctx.runQuery(internal.requirements.listInternal, {
          projectId: projectId as never,
        });
        if (requirements.length === 0) {
          throw new Error("No requirements persisted after AI extraction");
        }
        return `Persisted ${requirements.length} requirements`;
      });
    }

    await runStep("parse_inbound_email_with_ai", async () => {
      requirementId = await ctx.runMutation(
        internal.testing.fixtures.seedRequirementForEmailTestInternal,
        { projectId: projectId as never },
      );

      await ctx.runAction(internal.integrations.openaiActions.parseInboundEmailWithAI, {
        projectId: projectId as never,
        fromAddress: "planning@lacity.org",
        toAddresses: ["inbox@example.test"],
        subject: "Re: Clarification request — rear setback",
        body: [
          "Conditional applicability for the rear setback requirement.",
          "Please revise the site plan to show a 4-foot rear setback before resubmitting.",
          "Response needed by October 15, 2026.",
        ].join("\n"),
      });

      const communications = await ctx.runQuery(internal.communications.listInternal, {
        projectId: projectId as never,
      });
      const latest = communications[0];
      if (!latest) {
        throw new Error("No inbound communication recorded");
      }
      return `Recorded "${latest.classification ?? "unknown"}" / "${latest.detectedDecision ?? "n/a"}"`;
    });

    await runStep("draft_clarification_with_ai", async () => {
      if (!requirementId) {
        requirementId = await ctx.runMutation(
          internal.testing.fixtures.seedRequirementForEmailTestInternal,
          { projectId: projectId as never },
        );
      }

      await ctx.runAction(internal.integrations.openaiActions.draftClarificationWithAI, {
        projectId: projectId as never,
        requirementId: requirementId as never,
        toAddresses: ["agency-clarification@example.test"],
      });

      const approvals = await ctx.runQuery(internal.approvals.listPendingInternal, {
        projectId: projectId as never,
      });
      const draft = approvals[0];
      if (!draft) {
        throw new Error("No pending approval draft created");
      }
      return `Draft ready: "${draft.subject}" (${draft.body.length} chars)`;
    });

    await runStep("extract_document_facts_with_ai", async () => {
      if (!userId) {
        throw new Error("Missing test user");
      }

      const content = [
        "Site Plan v1",
        "Rear setback: 4 ft",
        "Proposed height: 16 ft",
        "Existing garage conversion to ADU",
        "Zoning: RD1.5",
      ].join("\n");

      const storageId = await ctx.storage.store(
        new Blob([content], { type: "text/plain" }),
      );

      const documentId = await ctx.runMutation(internal.testing.fixtures.createTextDocumentInternal, {
        projectId: projectId as never,
        userId: userId as never,
        storageId,
        suffix,
      });

      await ctx.runAction(internal.integrations.openaiActions.extractDocumentFactsWithAI, {
        documentId,
      });

      const document = await ctx.runQuery(internal.documents.getInternal, { documentId });
      const factCount = document?.extractedFacts?.length ?? 0;
      if (factCount < 2) {
        throw new Error(`Expected at least 2 facts, got ${factCount}`);
      }
      return `Extracted ${factCount} facts from uploaded site plan`;
    });

    await runStep("verify_ai_events", async () => {
      const events = await ctx.runQuery(internal.projects.listEventsInternal, {
        projectId: projectId as never,
        limit: 30,
      });
      const aiEvents = events.filter(
        (event) =>
          event.type.startsWith("ai.") ||
          event.actorLabel?.includes("OpenAI") ||
          event.message.toLowerCase().includes("openai"),
      );
      if (aiEvents.length === 0) {
        throw new Error("No AI-related events found in project timeline");
      }
      return `Found ${aiEvents.length} AI-related events`;
    });

    return summarize(steps, started, projectId as never);
  },
});

function summarize(
  steps: Array<{ name: string; ok: boolean; detail: string; durationMs: number }>,
  started: number,
  projectId: string | undefined,
) {
  const passed = steps.filter((step) => step.ok).length;
  const failed = steps.length - passed;
  return {
    ok: failed === 0,
    model: GREENLIGHT_AI_MODEL,
    projectId: projectId as never,
    steps,
    passed,
    failed,
    totalDurationMs: Date.now() - started,
  };
}
