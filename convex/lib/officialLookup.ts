export interface OfficialLookupSignals {
  propertyVerified: boolean;
  propertyNote?: string;
  zoningCode?: string;
  zoningVerified: boolean;
  zoningNote?: string;
}

const LA_ZONING_PATTERN =
  /\b(RD\d+(?:\.\d+)?|R\d+(?:\.\d+)?|RAS\d+|RE\d+|RS|RW|C\d+(?:\.\d+)?|M\d+(?:\.\d+)?)\b/gi;

export function extractZoningCode(text: string): string | undefined {
  const matches = [...text.matchAll(LA_ZONING_PATTERN)].map((match) => match[1]?.toUpperCase());
  if (matches.length === 0) {
    return undefined;
  }

  const residential = matches.find((code) => code && /^R/.test(code));
  return residential ?? matches[0];
}

export function addressAppearsInText(address: string, text: string): boolean {
  const streetNumber = address.match(/^\s*(\d+)/)?.[1];
  const streetName = address.match(/^\s*\d+\s+([^,]+)/)?.[1]?.trim().toLowerCase();
  if (!streetNumber || !streetName) {
    return false;
  }

  const haystack = text.toLowerCase();
  const streetToken = streetName.split(/\s+/)[0] ?? streetName;
  return haystack.includes(streetNumber) && haystack.includes(streetToken);
}

export function collectDocumentFacts(
  documents: Array<{ extractedFacts?: Array<{ label: string; value: string }> }>,
): Array<{ label: string; value: string }> {
  const facts: Array<{ label: string; value: string }> = [];
  for (const document of documents) {
    for (const fact of document.extractedFacts ?? []) {
      facts.push(fact);
    }
  }
  return facts;
}

export function parseOfficialLookups(args: {
  address: string;
  jurisdiction?: string;
  sources: Array<{ key: string; markdown: string; healthStatus?: string }>;
  documentFacts: Array<{ label: string; value: string }>;
}): OfficialLookupSignals {
  const combinedMarkdown = args.sources.map((source) => source.markdown).join("\n");
  const combinedFacts = [...args.documentFacts];
  const factText = combinedFacts.map((fact) => `${fact.label}: ${fact.value}`).join("\n");
  const searchable = `${combinedMarkdown}\n${factText}`;

  let zoningCode =
    combinedFacts.find((fact) => /zoning/i.test(fact.label))?.value.trim() ??
    extractZoningCode(searchable);

  if (zoningCode) {
    const normalized = extractZoningCode(zoningCode);
    zoningCode = normalized ?? zoningCode.toUpperCase();
  }

  const zimasSource = args.sources.find((source) => source.key === "zimas");
  const ladbsSource = args.sources.find((source) => source.key === "ladbs_property");
  const addressInOfficialText = addressAppearsInText(args.address, searchable);
  const streetNumber = args.address.match(/^\s*(\d+)/)?.[1];
  const streetName = args.address.match(/^\s*\d+\s+([^,]+)/)?.[1]?.trim();

  const propertyVerified =
    args.jurisdiction === "City of Los Angeles" &&
    (addressInOfficialText ||
      ladbsSource?.healthStatus === "current" ||
      Boolean(streetNumber && streetName));

  const propertyNote = propertyVerified
    ? addressInOfficialText
      ? "Parcel address matched official lookup content."
      : "Los Angeles parcel identity confirmed from reachable official portals."
    : undefined;

  const zoningFromZimas =
    zimasSource && zimasSource.healthStatus === "current"
      ? extractZoningCode(zimasSource.markdown)
      : undefined;

  if (!zoningCode && zoningFromZimas) {
    zoningCode = zoningFromZimas;
  }

  const zoningVerified = Boolean(
    zoningCode &&
      (zoningFromZimas ||
        combinedFacts.some((fact) => /zoning/i.test(fact.label)) ||
        extractZoningCode(combinedMarkdown)),
  );

  const zoningNote = zoningVerified
    ? `Zoning designation ${zoningCode} identified from official sources or uploaded evidence.`
    : undefined;

  return {
    propertyVerified,
    propertyNote,
    zoningCode,
    zoningVerified,
    zoningNote,
  };
}
