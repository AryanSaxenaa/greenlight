import type { ReactNode } from "react";

type DocumentSummary = {
  _id: string;
  filename: string;
  documentType: string;
  extractedFacts?: Array<{ label: string; value: string }>;
};

type EvidenceLinkSummary = {
  _id: string;
  documentId: string;
  requirementId: string;
  fact: string;
};

type RequirementSummary = {
  _id: string;
  nodeKey: string;
  title: string;
  status: string;
  blockedReason?: string;
  isPrimaryBlocker: boolean;
};

type EvidenceImpactSummaryProps = {
  documents: DocumentSummary[];
  evidenceLinks: EvidenceLinkSummary[];
  requirements: RequirementSummary[];
};

export function EvidenceImpactSummary({
  documents,
  evidenceLinks,
  requirements,
}: EvidenceImpactSummaryProps) {
  if (!documents.length) {
    return null;
  }

  const sitePlan = requirements.find((item) => item.nodeKey === "site_plan");
  const setback = requirements.find((item) => item.nodeKey === "setback");
  const structural = requirements.find((item) => item.nodeKey === "structural");

  return (
    <DashSectionShell title="What your uploads changed">
      {documents.map((document) => {
        const facts = document.extractedFacts ?? [];
        const documentLinks = evidenceLinks.filter((link) => link.documentId === document._id);
        const linkedTitles = [
          ...new Set(
            documentLinks
              .map(
                (link) =>
                  requirements.find((item) => item._id === link.requirementId)?.title,
              )
              .filter((title): title is string => Boolean(title)),
          ),
        ];

        return (
          <div className="evidence-impact-card" key={document._id}>
            <div className="evidence-impact-head">
              <strong>{document.filename}</strong>
              <span className="mono muted">{document.documentType}</span>
            </div>

            <ul className="evidence-impact-list">
              <li>
                <strong>Extracted:</strong>{" "}
                {facts.length > 0
                  ? facts.map((fact) => `${fact.label}: ${fact.value}`).join(" · ")
                  : "No readable text found (PDF may be image-only)."}
              </li>
              {sitePlan && document.documentType === "site_plan" ? (
                <li>
                  <strong>Site plan status:</strong> {sitePlan.status.toUpperCase()}
                  {sitePlan.status === "verified"
                    ? " — upload counted toward readiness."
                    : " — needs more evidence links or clearer plan content."}
                </li>
              ) : null}
              <li>
                <strong>Mapped to:</strong>{" "}
                {linkedTitles.length > 0
                  ? `${linkedTitles.join(", ")} (${documentLinks.length} evidence links)`
                  : "no requirements yet"}
              </li>
            </ul>
          </div>
        );
      })}

      <div className="evidence-impact-callouts">
        {setback?.status === "blocked" ? (
          <div className="evidence-impact-callout evidence-impact-callout-blocked">
            <strong>Why setback is still blocked</strong>
            <p>
              Your site plan upload does not include a confirmed rear setback measurement.
              Garage ADU projects start with setback as the primary blocker until a plan or
              agency reply confirms compliance.
            </p>
            {setback.blockedReason ? <p className="muted">{setback.blockedReason}</p> : null}
          </div>
        ) : null}

        {structural?.status === "missing" ? (
          <div className="evidence-impact-callout">
            <strong>Structural still missing</strong>
            <p>
              Upload engineering calculations under Evidence → document type{" "}
              <span className="mono">structural</span>. A site plan alone does not satisfy
              structural review.
            </p>
          </div>
        ) : null}
      </div>
    </DashSectionShell>
  );
}

function DashSectionShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="evidence-impact">
      <header className="evidence-impact-header">
        <span className="dash-section-kicker">Impact</span>
        <h3>{title}</h3>
      </header>
      {children}
    </section>
  );
}
