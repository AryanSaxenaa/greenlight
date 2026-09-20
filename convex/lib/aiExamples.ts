export const REQUIREMENTS_JSON_EXAMPLE = JSON.stringify(
  {
    requirements: [
      {
        nodeKey: "setback",
        title: "Rear setback applicability",
        category: "setback",
        status: "blocked",
        verificationStatus: "known",
        authority: "City Planning",
        blockedReason: "Official ADU guidance references rear setback rules for this lot.",
        sourceKey: "planning_adu",
        sourceExcerpt: "Detached ADUs must maintain a rear setback of at least 4 feet.",
        sortOrder: 3,
        isPrimaryBlocker: true,
      },
    ],
  },
  null,
  2,
);

export const INBOUND_EMAIL_JSON_EXAMPLE = JSON.stringify(
  {
    classification: "agency_response",
    detectedDecision: "Conditional applicability",
    projectImpact: "Rear setback requirement needs updated evidence.",
    actionRequired: "Upload revised site plan showing rear setback.",
    linkedRequirementNodeKey: "setback",
    extractions: [
      {
        extractionType: "new_condition",
        value: "Maintain 4-foot rear setback",
        confidence: 0.82,
      },
    ],
  },
  null,
  2,
);

export const CLARIFICATION_DRAFT_JSON_EXAMPLE = JSON.stringify(
  {
    subject: "Clarification request: Rear setback applicability",
    body: "Hello,\n\nWe are preparing a residential ADU project and need clarification on rear setback applicability.\n\nPROJECT FACTS USED\n- Property: 1234 Sunset Blvd, Los Angeles, CA\n\nThank you,\nGreenlight project team",
    factsUsed: ["Property: 1234 Sunset Blvd, Los Angeles, CA"],
  },
  null,
  2,
);

export const DOCUMENT_FACTS_JSON_EXAMPLE = JSON.stringify(
  {
    facts: [
      { label: "Rear setback", value: "4 ft", confidence: 0.9 },
      { label: "Building height", value: "16 ft", confidence: 0.85 },
    ],
  },
  null,
  2,
);
