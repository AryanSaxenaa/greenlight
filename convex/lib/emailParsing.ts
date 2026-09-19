import type { Id } from "../_generated/dataModel";

export interface ParsedInboundEmail {
  classification: string;
  detectedDecision: string;
  projectImpact: string;
  actionRequired: string;
  linkedRequirementId?: Id<"requirements">;
  extractions: Array<{
    extractionType: string;
    value: string;
    confidence: number;
  }>;
}

interface MatchableRequirement {
  _id: Id<"requirements">;
  title: string;
  category: string;
  blockedReason?: string;
}

export function parseInboundEmail(
  subject: string,
  body: string,
  requirements: Array<MatchableRequirement>,
): ParsedInboundEmail {
  const haystack = `${subject}\n${body}`.toLowerCase();
  const extractions: ParsedInboundEmail["extractions"] = [];

  let classification = "general_correspondence";
  if (/clarif|response|reply|re:/i.test(subject)) {
    classification = "agency_response";
  } else if (/correction|revise|resubmit/i.test(haystack)) {
    classification = "correction_request";
  } else if (/approved|approval|cleared/i.test(haystack)) {
    classification = "approval_notice";
  } else if (/denied|rejected|incomplete/i.test(haystack)) {
    classification = "denial_notice";
  }

  let detectedDecision = "Information received";
  if (/conditional/i.test(haystack)) {
    detectedDecision = "Conditional applicability";
  } else if (/not applicable|does not apply/i.test(haystack)) {
    detectedDecision = "Not applicable";
  } else if (/confirm|clarif/i.test(haystack)) {
    detectedDecision = "Clarification provided";
  }

  const deadlineMatch = body.match(/by\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})/i);
  if (deadlineMatch) {
    extractions.push({
      extractionType: "deadline",
      value: deadlineMatch[0],
      confidence: 0.75,
    });
  }

  const conditionMatch = body.match(/(?:condition|requirement)[:\s]+([^\n.]{8,120})/i);
  if (conditionMatch?.[1]) {
    extractions.push({
      extractionType: "new_condition",
      value: conditionMatch[1].trim(),
      confidence: 0.7,
    });
  }

  const ranked = requirements
    .map((requirement) => {
      const tokens = [requirement.title, requirement.category, requirement.blockedReason ?? ""]
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

  const linkedRequirement = ranked[0]?.requirement;
  if (linkedRequirement) {
    extractions.push({
      extractionType: "requirement_impact",
      value: linkedRequirement.title,
      confidence: Math.min(0.95, 0.5 + ranked[0].score * 0.15),
    });
  }

  const projectImpact = linkedRequirement
    ? `Requirement "${linkedRequirement.title}" may need re-verification.`
    : "No linked requirement identified yet.";

  const actionRequired = conditionMatch
    ? "Review new condition and update project evidence."
    : linkedRequirement
      ? `Update evidence for ${linkedRequirement.title}.`
      : "Review message and link to a requirement manually.";

  return {
    classification,
    detectedDecision,
    projectImpact,
    actionRequired,
    linkedRequirementId: linkedRequirement?._id,
    extractions,
  };
}
