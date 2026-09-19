"use node";

import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";
import {
  extractFactsFromText,
  requirementNodeKeysForDocumentType,
} from "../lib/documentExtraction";

export const extractFacts = internalAction({
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
      message: `Extracting facts from ${document.filename}.`,
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

    const facts = extractFactsFromText(text, document.documentType, document.filename);
    const nodeKeys = requirementNodeKeysForDocumentType(document.documentType);

    await ctx.runMutation(internal.documents.applyExtractionInternal, {
      documentId: args.documentId,
      projectId: document.projectId,
      facts,
      nodeKeys,
    });

    await ctx.runMutation(internal.agentRuns.completeInternal, {
      runId,
      message: `Extracted ${facts.length} facts.`,
    });

    return null;
  },
});
