export const LA_OFFICIAL_SOURCES = [
  {
    key: "ladbs_property",
    url: "https://www.ladbsservices2.lacity.org/",
    authority: "LADBS",
    label: "LADBS property lookup",
    sourceType: "portal",
  },
  {
    key: "zimas",
    url: "https://zimas.lacity.org/",
    authority: "City Planning",
    label: "ZIMAS zoning lookup",
    sourceType: "portal",
  },
  {
    key: "planning_adu",
    url: "https://planning.lacity.gov/plans-policies/initiatives-policies/accessory-dwelling-units",
    authority: "City Planning",
    label: "ADU ordinance guidance",
    sourceType: "regulation",
  },
  {
    key: "ladbs_adu",
    url: "https://housing.lacity.org/rental-property-owners/accessory-dwelling-unit",
    authority: "LADBS",
    label: "LADBS ADU permitting",
    sourceType: "regulation",
  },
] as const;

/** Used when Firecrawl/bots are blocked from city sites (403). Still cites official LAMC ADU rules. */
export const LADBS_ADU_REFERENCE_MARKDOWN = `
# LADBS — Accessory Dwelling Units (reference)

Official Los Angeles ADU rules are codified in LAMC Section 12.22.A.33 (City ordinance 186481) and state Gov. Code §65852.2.

## Plan check & permitting (LADBS)
- Submit a complete building permit application with plans and fees to the Department of Building and Safety (LADBS).
- LADBS screens completeness, routes zoning plan check to City Planning, then structural/building review.
- Structural calculations are required when modifying load-bearing elements or converting garages.
- Scaled site plans showing existing/proposed structures, setbacks, and height are required for plan check.
- Detached ADUs must maintain rear and side setbacks per zone standards (commonly 4 feet rear for many lots).
- Maximum height for detached ADUs is typically 16 feet unless local standards allow more.
- Parking may be waived for ADUs within one-half mile of public transit.

Source: LA Housing Department ADU program page and LADBS permitting workflow (housing.lacity.org, LAMC 12.22.A.33).
`.trim();

export function normalizeSourceUrl(url: string): string {
  try {
    const parsed = new URL(url.trim());
    parsed.hash = "";
    parsed.search = "";
    let pathname = parsed.pathname.replace(/\/+$/, "");
    if (pathname === "") {
      pathname = "/";
    }
    return `${parsed.protocol}//${parsed.host.toLowerCase()}${pathname}`;
  } catch {
    return url.trim().toLowerCase();
  }
}

export function isGenericPlanningHomepage(args: {
  url: string;
  title?: string;
  markdownPreview: string;
}): boolean {
  const normalizedUrl = normalizeSourceUrl(args.url);
  const isHomePath =
    normalizedUrl.endsWith("planning.lacity.gov") ||
    normalizedUrl.endsWith("planning.lacity.gov/");
  const titleLooksGeneric =
    !args.title ||
    /home\s*\|\s*los angeles city planning/i.test(args.title) ||
    args.title.trim().toLowerCase() === "los angeles city planning";
  const bodyLooksGeneric =
    args.markdownPreview.length < 1200 &&
    /beware of fraudulent emails/i.test(args.markdownPreview);

  return isHomePath || (titleLooksGeneric && bodyLooksGeneric);
}
