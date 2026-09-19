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
    url: "https://ladbs.lacity.gov/services/check-status-and-permits/accessory-dwelling-units-adus",
    authority: "LADBS",
    label: "LADBS ADU permitting",
    sourceType: "regulation",
  },
] as const;
