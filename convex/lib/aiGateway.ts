import { generateText } from "ai";
import { convexGateway } from "@convex-dev/ai-sdk-provider";
import type { z } from "zod";
import { GREENLIGHT_AI_MODEL } from "./aiSchemas";

export function formatAiError(error: unknown): string {
  return error instanceof Error
    ? `${error.name}: ${error.message}${error.cause ? ` | cause: ${String(error.cause)}` : ""}`
    : String(error);
}

function parseJsonResponse(raw: string): unknown {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");

  return JSON.parse(cleaned) as unknown;
}

export async function generateStructuredWithGateway<T>(args: {
  schema: z.ZodType<T>;
  prompt: string;
  jsonExample: string;
  model?: string;
}): Promise<{ data: T; mode: "text" }> {
  const model = args.model ?? GREENLIGHT_AI_MODEL;

  const { text } = await generateText({
    model: convexGateway(model),
    prompt: [
      args.prompt,
      "",
      "Return ONLY valid JSON matching this example shape:",
      args.jsonExample,
      "Do not include markdown fences or commentary.",
    ].join("\n"),
  });

  const parsed = parseJsonResponse(text);
  return { data: args.schema.parse(parsed), mode: "text" };
}
