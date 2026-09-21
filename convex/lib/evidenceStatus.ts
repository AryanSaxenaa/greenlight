import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

type RequirementStatus =
  | "verified"
  | "blocked"
  | "review"
  | "missing"
  | "locked";

export async function applyEvidenceStatusForRequirement(
  ctx: MutationCtx,
  requirement: {
    _id: Id<"requirements">;
    nodeKey: string;
    status: RequirementStatus;
  },
  nodeKey: string,
) {
  let status = requirement.status;
  if (status === "missing") {
    await ctx.db.patch("requirements", requirement._id, {
      status: "review",
      verificationStatus: "unverified",
    });
    status = "review";
  }

  if (nodeKey === "site_plan" && status === "review") {
    const evidence = await ctx.db
      .query("evidenceLinks")
      .withIndex("by_requirement", (q) => q.eq("requirementId", requirement._id))
      .take(2);
    if (evidence.length >= 2) {
      await ctx.db.patch("requirements", requirement._id, {
        status: "verified",
        verificationStatus: "known",
      });
    }
  }
}
