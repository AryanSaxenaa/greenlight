import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { internal } from "./_generated/api";

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({
  path: "/webhooks/agentmail",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const rawBody = await request.text();
    const webhookSecret = process.env.AGENTMAIL_WEBHOOK_SECRET;

    if (webhookSecret) {
      const signature = request.headers.get("svix-signature");
      if (!signature) {
        return new Response("Missing webhook signature", { status: 401 });
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

    await ctx.runMutation(internal.communications.recordInboundInternal, {
      projectId: project._id,
      providerMessageId: payload.data.message_id,
      threadId: payload.data.thread_id,
      fromAddress: payload.data.from,
      toAddresses: payload.data.to ?? [],
      subject: payload.data.subject ?? "Agency correspondence",
      body,
    });

    await ctx.runMutation(internal.projects.appendEventInternal, {
      projectId: project._id,
      type: "email.received",
      message: `Inbound agency message received: ${payload.data.subject ?? "No subject"}`,
    });

    return new Response("OK", { status: 200 });
  }),
});

export default http;
