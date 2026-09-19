import type { Id } from "../_generated/dataModel";

export interface MatchableRequirement {
  _id: Id<"requirements">;
  title: string;
  category: string;
  blockedReason?: string;
}

export function matchRequirementForInboundEmail(
  requirements: Array<MatchableRequirement>,
  subject: string,
  body: string,
): Id<"requirements"> | undefined {
  const haystack = `${subject}\n${body}`.toLowerCase();

  const ranked = requirements
    .map((requirement) => {
      const tokens = [
        requirement.title,
        requirement.category,
        requirement.blockedReason ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length > 3);

      const score = tokens.reduce(
        (total, token) => total + (haystack.includes(token) ? 1 : 0),
        0,
      );

      return { requirement, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  return ranked[0]?.requirement._id;
}
