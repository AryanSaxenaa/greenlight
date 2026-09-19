"use node";

import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";
import {
  extractFactsFromText,
  requirementCategoriesForDocumentType,
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

    const blob = await ctx.storage.get(document.storageId);
    if (!blob) {
      return null;
    }

    let text = "";
    if (
      document.mimeType.startsWith("text/") ||
      document.mimeType === "application/json"
    ) {
      text = await blob.text();
    } else {
      text = `${document.filename}\n${document.documentType}`;
    }

    const facts = extractFactsFromText(text, document.documentType);
    const categories = requirementCategoriesForDocumentType(document.documentType);

    await ctx.runMutation(internal.documents.applyExtractionInternal, {
      documentId: args.documentId,
      projectId: document.projectId,
      facts,
      categories,
    });

    return null;
  },
});
