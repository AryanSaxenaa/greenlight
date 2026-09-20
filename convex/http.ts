import { registerStaticRoutes } from "@convex-dev/static-hosting";
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { components, internal } from "./_generated/api";
import { verifySvixSignature } from "./lib/svix";
import { verifySharedWebhookSecret } from "./lib/webhookAuth";

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({
  path: "/webhooks/agentmail",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const rawBody = await request.text();
    const webhookSecret = process.env.AGENTMAIL_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return new Response("Webhook secret not configured", { status: 503 });
    }

    const verified = await verifySvixSignature(webhookSecret, rawBody, {
      id: request.headers.get("svix-id"),
      timestamp: request.headers.get("svix-timestamp"),
      signature: request.headers.get("svix-signature"),
    });

    if (!verified) {
      return new Response("Invalid webhook signature", { status: 401 });
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

    if (payload.data.message_id) {
      const duplicate = await ctx.runQuery(
        internal.communications.findByProviderMessageInternal,
        {
          projectId: project._id,
          providerMessageId: payload.data.message_id,
        },
      );
      if (duplicate) {
        return new Response("Duplicate message ignored", { status: 200 });
      }
    }

    const body =
      payload.data.extracted_text ?? payload.data.text ?? "Inbound message received.";

    await ctx.scheduler.runAfter(
      0,
      internal.integrations.openaiActions.parseInboundEmailWithAI,
      {
        projectId: project._id,
        providerMessageId: payload.data.message_id,
        threadId: payload.data.thread_id,
        fromAddress: payload.data.from,
        toAddresses: payload.data.to ?? [],
        subject: payload.data.subject ?? "Agency correspondence",
        body,
      },
    );

    return new Response("OK", { status: 200 });
  }),
});

http.route({
  path: "/webhooks/firecrawl",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.FIRECRAWL_WEBHOOK_SECRET;
    if (!verifySharedWebhookSecret(request, webhookSecret)) {
      return new Response("Unauthorized webhook", { status: 401 });
    }

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
