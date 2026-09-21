"use node";

import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";

interface AgentMailInbox {
  inbox_id: string;
  email: string;
  client_id?: string;
  metadata?: Record<string, string>;
}

interface AgentMailErrorBody {
  code?: string;
  message?: string;
  fix?: string;
  limit?: number;
}

interface ListInboxesResponse {
  inboxes?: AgentMailInbox[];
  next_page_token?: string;
}

const AGENTMAIL_API = "https://api.agentmail.to/v0";

function authHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

async function listAllInboxes(apiKey: string): Promise<AgentMailInbox[]> {
  const collected: AgentMailInbox[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < 10; page += 1) {
    const url = new URL(`${AGENTMAIL_API}/inboxes`);
    url.searchParams.set("limit", "100");
    if (pageToken) {
      url.searchParams.set("page_token", pageToken);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!response.ok) {
      break;
    }

    const payload = (await response.json()) as ListInboxesResponse;
    collected.push(...(payload.inboxes ?? []));
    pageToken = payload.next_page_token;
    if (!pageToken) {
      break;
    }
  }

  return collected;
}

function parseAgentMailError(body: string): AgentMailErrorBody {
  try {
    return JSON.parse(body) as AgentMailErrorBody;
  } catch {
    return { message: body.slice(0, 280) };
  }
}

function formatFailureMessage(status: number, body: string): string {
  const parsed = parseAgentMailError(body);
  if (parsed.code === "limit_exceeded") {
    const limitNote =
      typeof parsed.limit === "number" ? ` (plan limit: ${parsed.limit} inboxes)` : "";
    return (
      parsed.fix ??
      `AgentMail inbox limit reached${limitNote}. Delete unused inboxes at console.agentmail.to, or set AGENTMAIL_FALLBACK_INBOX_ID and AGENTMAIL_FALLBACK_INBOX_EMAIL on Convex to reuse one inbox for demos.`
    );
  }
  if (parsed.fix) {
    return parsed.fix;
  }
  if (parsed.message) {
    return `AgentMail inbox provisioning failed (${status}): ${parsed.message}`;
  }
  return `AgentMail inbox provisioning failed (${status}).`;
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

    const project = await ctx.runQuery(internal.projects.getInternal, {
      projectId: args.projectId,
    });
    if (project?.inboxId && project.inboxEmail) {
      return null;
    }

    const clientId = `greenlight-${args.projectId}`;
    const existingInboxes = await listAllInboxes(apiKey);
    const matched = existingInboxes.find(
      (inbox) =>
        inbox.client_id === clientId ||
        inbox.metadata?.projectId === args.projectId,
    );
    if (matched) {
      await ctx.runMutation(internal.projects.setInboxInternal, {
        projectId: args.projectId,
        inboxId: matched.inbox_id,
        inboxEmail: matched.email,
      });
      await ctx.runMutation(internal.projects.appendEventInternal, {
        projectId: args.projectId,
        type: "inbox.provisioned",
        message: `Linked existing AgentMail inbox ${matched.email}.`,
      });
      return null;
    }

    const fallbackInboxId = process.env.AGENTMAIL_FALLBACK_INBOX_ID?.trim();
    const fallbackInboxEmail = process.env.AGENTMAIL_FALLBACK_INBOX_EMAIL?.trim();
    if (fallbackInboxId && fallbackInboxEmail) {
      await ctx.runMutation(internal.projects.setInboxInternal, {
        projectId: args.projectId,
        inboxId: fallbackInboxId,
        inboxEmail: fallbackInboxEmail,
      });
      await ctx.runMutation(internal.projects.appendEventInternal, {
        projectId: args.projectId,
        type: "inbox.provisioned",
        message: `Using shared AgentMail inbox ${fallbackInboxEmail} (fallback). Outbound mail still requires your approval.`,
      });
      return null;
    }

    const response = await fetch(`${AGENTMAIL_API}/inboxes`, {
      method: "POST",
      headers: authHeaders(apiKey),
      body: JSON.stringify({
        username: `gl-${args.projectId.slice(-10)}`,
        display_name: "Greenlight Project Inbox",
        client_id: clientId,
        metadata: { projectId: args.projectId },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      const parsed = parseAgentMailError(body);

      if (parsed.code === "limit_exceeded" && existingInboxes.length > 0) {
        const reuse = existingInboxes[0];
        if (reuse) {
          await ctx.runMutation(internal.projects.setInboxInternal, {
            projectId: args.projectId,
            inboxId: reuse.inbox_id,
            inboxEmail: reuse.email,
          });
          await ctx.runMutation(internal.projects.appendEventInternal, {
            projectId: args.projectId,
            type: "inbox.provisioned",
            message: `Linked existing AgentMail inbox ${reuse.email} — new inbox creation is blocked by your plan limit.`,
          });
          return null;
        }
      }

      const message = formatFailureMessage(response.status, body);

      await ctx.runMutation(internal.projects.appendEventInternal, {
        projectId: args.projectId,
        type: "inbox.failed",
        message,
      });

      return null;
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
      await ctx.runMutation(internal.approvals.revertToPendingInternal, {
        approvalId: args.approvalId,
        reason: "Email send failed: AGENTMAIL_API_KEY is not configured.",
      });
      throw new Error("AGENTMAIL_API_KEY is not configured");
    }

    const approval = await ctx.runQuery(internal.approvals.getInternal, {
      approvalId: args.approvalId,
    });
    if (!approval) {
      throw new Error("Approval not found");
    }

    if (approval.status !== "approved") {
      return null;
    }

    let project = await ctx.runQuery(internal.projects.getInternal, {
      projectId: approval.projectId,
    });

    if (!project?.inboxId) {
      await ctx.runAction(internal.integrations.agentmailActions.provisionProjectInbox, {
        projectId: approval.projectId,
      });
      project = await ctx.runQuery(internal.projects.getInternal, {
        projectId: approval.projectId,
      });
    }

    if (!project?.inboxId) {
      await ctx.runMutation(internal.approvals.revertToPendingInternal, {
        approvalId: args.approvalId,
        reason:
          "Email send failed: project inbox is not provisioned. Open Activity → Retry inbox setup, or set AGENTMAIL_FALLBACK_INBOX_* on Convex.",
      });
      throw new Error("Project inbox is not provisioned");
    }

    try {
      const response = await fetch(
        `${AGENTMAIL_API}/inboxes/${encodeURIComponent(project.inboxId)}/messages/send`,
        {
          method: "POST",
          headers: authHeaders(apiKey),
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown send error";
      await ctx.runMutation(internal.approvals.revertToPendingInternal, {
        approvalId: args.approvalId,
        reason: `Email send failed: ${message}`,
      });
      throw error;
    }

    return null;
  },
});
