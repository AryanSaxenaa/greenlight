import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { appendEvent } from "./compiler";

export async function seedInitialRequirements(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  sourceIds: Map<string, Id<"sources">>,
) {
  const existing = await ctx.db
    .query("requirements")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .take(1);

  if (existing.length > 0) {
    return;
  }

  const rows = [
    {
      title: "Property identity",
      category: "property",
      status: "verified" as const,
      authority: "City of Los Angeles",
      sourceKey: "ladbs_property",
      sortOrder: 1,
      isPrimaryBlocker: false,
    },
    {
      title: "Zoning designation",
      category: "zoning",
      status: "verified" as const,
      authority: "City Planning",
      sourceKey: "zimas",
      sortOrder: 2,
      isPrimaryBlocker: false,
    },
    {
      title: "Rear setback applicability",
      category: "setback",
      status: "blocked" as const,
      authority: "City Planning",
      sourceKey: "planning_adu",
      blockedReason:
        "Official guidance and current project configuration require clarification.",
      sortOrder: 3,
      isPrimaryBlocker: true,
    },
    {
      title: "Building height limit",
      category: "height",
      status: "verified" as const,
      authority: "City Planning",
      sourceKey: "planning_adu",
      sortOrder: 4,
      isPrimaryBlocker: false,
    },
    {
      title: "Site plan",
      category: "site_plan",
      status: "review" as const,
      authority: "LADBS Plan Check",
      evidenceRequired: "Scaled site plan with existing and proposed structures",
      sortOrder: 5,
      isPrimaryBlocker: false,
    },
    {
      title: "Structural calculations",
      category: "structural",
      status: "missing" as const,
      authority: "LADBS",
      evidenceRequired: "Engineering calcs for new or modified load-bearing elements",
      sortOrder: 6,
      isPrimaryBlocker: false,
    },
    {
      title: "Building permit application",
      category: "permit",
      status: "locked" as const,
      authority: "LADBS",
      blockedReason: "Unlocks after open plan-check requirements are satisfied.",
      sortOrder: 7,
      isPrimaryBlocker: false,
    },
  ];

  for (const row of rows) {
    const sourceId = row.sourceKey ? sourceIds.get(row.sourceKey) : undefined;
    const source = sourceId ? await ctx.db.get("sources", sourceId) : null;

    await ctx.db.insert("requirements", {
      projectId,
      title: row.title,
      category: row.category,
      status: row.status,
      authority: row.authority,
      sourceLabel: source?.label,
      sourceUrl: source?.url,
      sourceId,
      evidenceRequired: row.evidenceRequired,
      blockedReason: row.blockedReason,
      sortOrder: row.sortOrder,
      isPrimaryBlocker: row.isPrimaryBlocker,
    });
  }

  await appendEvent(
    ctx,
    projectId,
    "requirements.seeded",
    `Structured ${rows.length} requirements from LA ADU pathway template.`,
  );
}
