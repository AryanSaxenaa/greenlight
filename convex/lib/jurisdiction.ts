const LA_ZIP_PREFIXES = ["900", "901", "902", "903", "904", "905", "906", "907", "908", "910", "911", "912", "913", "914", "915", "916", "917", "918"];

export interface JurisdictionResolution {
  supported: boolean;
  jurisdiction?: string;
  city?: string;
  county?: string;
  state?: string;
  parcelId?: string;
  zoning?: string;
  normalizedAddress: string;
  message: string;
}

export function resolveJurisdiction(address: string): JurisdictionResolution {
  const normalized = address.trim().replace(/\s+/g, " ");
  const lower = normalized.toLowerCase();

  const inLosAngelesCity =
    lower.includes("los angeles") ||
    /\bla\b/.test(lower) ||
    LA_ZIP_PREFIXES.some((prefix) => lower.includes(prefix));

  if (!inLosAngelesCity) {
    return {
      supported: false,
      normalizedAddress: normalized,
      message:
        "Jurisdiction not yet supported. Los Angeles city addresses resolve automatically.",
    };
  }

  const zipMatch = normalized.match(/\b(90\d{3})(?:-\d{4})?\b/);
  const streetNumber = normalized.match(/^\d+/)?.[0];

  return {
    supported: true,
    jurisdiction: "City of Los Angeles",
    city: "Los Angeles",
    county: "Los Angeles County",
    state: "California",
    parcelId: streetNumber && zipMatch ? `PENDING-${streetNumber}-${zipMatch[1]}` : undefined,
    zoning: undefined,
    normalizedAddress: normalized,
    message: `Jurisdiction resolved to City of Los Angeles${zipMatch ? ` (${zipMatch[1]})` : ""}. Parcel and zoning require authoritative lookup.`,
  };
}

export function validateSupportedAddress(address: string): string | null {
  const trimmed = address.trim();
  if (trimmed.length < 10) {
    return "Enter a complete street address with city and state.";
  }
  if (!/\d/.test(trimmed)) {
    return "Address must include a street number.";
  }
  if (!trimmed.includes(",")) {
    return "Include city and state separated by a comma.";
  }
  const resolution = resolveJurisdiction(trimmed);
  if (!resolution.supported) {
    return resolution.message;
  }
  return null;
}
