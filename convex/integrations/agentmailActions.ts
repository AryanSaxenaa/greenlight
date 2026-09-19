"use node";

import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";

interface AgentMailInbox {
  inbox_id: string;
  email: string;
}

export const provisionProjectInbox = internalAction({
  args: { projectId: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const apiKey = process.env.AGENTMAIL_API_KEY;
    if (!apiKey) {
      await ctx.runMutation(internal.projects.appendEventInternal, {
        projectId: args.projectId,
        type: "inbox.skipped",
        message:
          "AgentMail API key not configured. Set AGENTMAIL_API_KEY on the deployment.",
      });
      return null;
    }

    const clientId = `greenlight-${args.projectId}`;
    const response = await fetch("https://api.agentmail.to/v0/inboxes", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: `greenlight-${args.projectId.slice(-8)}`,
        display_name: "Greenlight Project Inbox",
        client_id: clientId,
        metadata: { projectId: args.projectId },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      await ctx.runMutation(internal.projects.appendEventInternal, {
        projectId: args.projectId,
        type: "inbox.failed",
        message: `AgentMail inbox provisioning failed (${response.status}).`,
      });
      throw new Error(`AgentMail inbox error: ${body}`);
    }

    const inbox = (await response.json()) as AgentMailInbox;
    await ctx.runMutation(internal.projects.setInboxInternal, {
      projectId: args.projectId,
      inboxId: inbox.inbox_id,
      inboxEmail: inbox.email,
    });

    await ctx.runMutation(internal.projects.appendEventInternal, {
      projectId: args.projectId,
      type: "inbox.provisioned",
      message: "Project correspondence inbox provisioned.",
    });

    return null;
  },
});

export const sendApprovedEmail = internalAction({
  args: { approvalId: v.id("approvals") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const apiKey = process.env.AGENTMAIL_API_KEY;
    if (!apiKey) {
      throw new Error("AGENTMAIL_API_KEY is not configured");
    }

    const approval = await ctx.runQuery(internal.approvals.getInternal, {
      approvalId: args.approvalId,
    });
    if (!approval) {
      throw new Error("Approval not found");
    }

    const project = await ctx.runQuery(internal.projects.getInternal, {
      projectId: approval.projectId,
    });
    if (!project?.inboxId) {
      throw new Error("Project inbox is not provisioned");
    }

    const response = await fetch(
      `https://api.agentmail.to/v0/inboxes/${encodeURIComponent(project.inboxId)}/messages/send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: approval.toAddresses,
          subject: approval.subject,
          text: approval.body,
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`AgentMail send failed: ${body}`);
    }

    const payload = (await response.json()) as { message_id?: string };
    await ctx.runMutation(internal.approvals.markSentInternal, {
      approvalId: args.approvalId,
      providerMessageId: payload.message_id,
    });

    await ctx.runMutation(internal.communications.recordOutboundInternal, {
      projectId: approval.projectId,
      subject: approval.subject,
      body: approval.body,
      toAddresses: approval.toAddresses,
      providerMessageId: payload.message_id,
      requirementId: approval.requirementId,
      deliveryStatus: "delivered",
    });

    await ctx.runMutation(internal.projects.appendEventInternal, {
      projectId: approval.projectId,
      type: "email.sent",
      message: `Clarification email sent: ${approval.subject}`,
    });

    return null;
  },
});
