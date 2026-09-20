import { registerStaticRoutes } from "@convex-dev/static-hosting";
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { components, internal } from "./_generated/api";
import { parseInboundEmail } from "./lib/emailParsing";
import { verifySvixSignature } from "./lib/svix";

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({
  path: "/webhooks/agentmail",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const rawBody = await request.text();
    const webhookSecret = process.env.AGENTMAIL_WEBHOOK_SECRET;

    if (webhookSecret) {
      const verified = await verifySvixSignature(webhookSecret, rawBody, {
        id: request.headers.get("svix-id"),
        timestamp: request.headers.get("svix-timestamp"),
        signature: request.headers.get("svix-signature"),
      });

      if (!verified) {
        return new Response("Invalid webhook signature", { status: 401 });
      }
    }

    let payload: {
      type?: string;
      data?: {
        inbox_id?: string;
        message_id?: string;
        thread_id?: string;
        from?: string;
        to?: string[];
        subject?: string;
        text?: string;
        extracted_text?: string;
      };
    };

    try {
      payload = JSON.parse(rawBody) as typeof payload;
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    if (payload.type !== "message.received" || !payload.data?.inbox_id) {
      return new Response("Ignored", { status: 200 });
    }

    const project = await ctx.runQuery(internal.projects.getByInboxInternal, {
      inboxId: payload.data.inbox_id,
    });

    if (!project) {
      return new Response("Project not found", { status: 404 });
    }

    const body =
      payload.data.extracted_text ?? payload.data.text ?? "Inbound message received.";

    const requirements = await ctx.runQuery(internal.requirements.listInternal, {
      projectId: project._id,
    });

    const parsed = parseInboundEmail(
      payload.data.subject ?? "",
      body,
      requirements,
    );

    await ctx.runMutation(internal.communications.recordInboundInternal, {
      projectId: project._id,
      providerMessageId: payload.data.message_id,
      threadId: payload.data.thread_id,
      fromAddress: payload.data.from,
      toAddresses: payload.data.to ?? [],
      subject: payload.data.subject ?? "Agency correspondence",
      body,
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
      projectId: project._id,
      type: "email.received",
      message: parsed.linkedRequirementId
        ? `Inbound agency message linked to a requirement: ${payload.data.subject ?? "No subject"}`
        : `Inbound agency message received: ${payload.data.subject ?? "No subject"}`,
      actorType: "agency",
      actorLabel: payload.data.from ?? "Agency",
    });

    return new Response("OK", { status: 200 });
  }),
});

http.route({
  path: "/webhooks/firecrawl",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const rawBody = await request.text();

    let payload: {
      type?: string;
      data?: Array<{
        monitorId?: string;
        url?: string;
        status?: string;
        currentScrapeId?: string;
        judgment?: {
          reason?: string;
          meaningfulChanges?: Array<{
            before?: string | null;
            after?: string | null;
            reason?: string;
          }>;
        };
        diff?: {
          text?: string;
        };
      }>;
    };

    try {
      payload = JSON.parse(rawBody) as typeof payload;
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    if (payload.type !== "monitor.page" || !payload.data?.length) {
      return new Response("Ignored", { status: 200 });
    }

    for (const page of payload.data) {
      if (!page.monitorId || !page.url || !page.status) {
        continue;
      }

      const changeSummary =
        page.judgment?.reason ??
        page.judgment?.meaningfulChanges?.[0]?.reason ??
        "Official source content changed.";

      if (page.status === "changed") {
        await ctx.scheduler.runAfter(
          0,
          internal.integrations.firecrawlActions.rescrapeMonitoredSource,
          {
            monitorId: page.monitorId,
            changeSummary,
            diffText: page.diff?.text ?? "",
          },
        );
      } else {
        await ctx.runMutation(internal.integrations.firecrawlWebhook.processMonitorPage, {
          monitorId: page.monitorId,
          url: page.url,
          status: page.status,
          changeSummary,
        });
      }
    }

    return new Response("OK", { status: 200 });
  }),
});

registerStaticRoutes(http, components.staticHosting);

export default http;
