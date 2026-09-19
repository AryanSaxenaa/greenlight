import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { internal } from "./_generated/api";
import { matchRequirementForInboundEmail } from "./lib/emailMatching";
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

    const linkedRequirementId = matchRequirementForInboundEmail(
      requirements,
      payload.data.subject ?? "",
      body,
    );

    await ctx.runMutation(internal.communications.recordInboundInternal, {
      projectId: project._id,
      providerMessageId: payload.data.message_id,
      threadId: payload.data.thread_id,
      fromAddress: payload.data.from,
      toAddresses: payload.data.to ?? [],
      subject: payload.data.subject ?? "Agency correspondence",
      body,
      linkedRequirementId,
    });

    await ctx.runMutation(internal.projects.appendEventInternal, {
      projectId: project._id,
      type: "email.received",
      message: linkedRequirementId
        ? `Inbound agency message linked to a requirement: ${payload.data.subject ?? "No subject"}`
        : `Inbound agency message received: ${payload.data.subject ?? "No subject"}`,
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

      const markdownPreview = page.diff?.text?.slice(0, 1200);
      const contentHash = markdownPreview
        ? await hashText(markdownPreview)
        : undefined;

      await ctx.runMutation(internal.integrations.firecrawlWebhook.processMonitorPage, {
        monitorId: page.monitorId,
        url: page.url,
        status: page.status,
        changeSummary,
        contentHash,
        markdownPreview,
      });
    }

    return new Response("OK", { status: 200 });
  }),
});

async function hashText(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export default http;
