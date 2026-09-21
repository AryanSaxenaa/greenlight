type ProjectEvent = {
  type: string;
  message: string;
};

export function formatEventMessage(event: ProjectEvent): string {
  if (event.type === "ai.extraction_fallback") {
    return "AI extraction used backup rules from official sources.";
  }

  if (event.type === "ai.document_fallback") {
    return "Document facts extracted using built-in parser.";
  }

  if (event.type === "ai.draft_fallback") {
    return "Clarification draft generated from template.";
  }

  if (event.message.includes("invalid_value") || event.message.includes("Invalid option")) {
    return "Structured AI output was corrected automatically.";
  }

  if (event.message.length > 180) {
    return `${event.message.slice(0, 177)}…`;
  }

  return event.message;
}

export function eventTone(type: string): "neutral" | "success" | "warn" | "system" {
  if (type.includes("failed") || type.includes("fallback")) {
    return "warn";
  }
  if (type.includes("complete") || type.includes("verified") || type.includes("scraped")) {
    return "success";
  }
  if (type.startsWith("ai.")) {
    return "system";
  }
  return "neutral";
}
