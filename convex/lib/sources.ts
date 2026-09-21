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
    url: "https://dbs.lacity.gov/adu",
    authority: "LADBS",
    label: "LADBS ADU permitting",
    sourceType: "regulation",
  },
] as const;

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
