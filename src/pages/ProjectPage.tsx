import { useMutation, useQuery } from "convex/react";
import { FormEvent, useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { AppPageLayout } from "../components/AppPageLayout";
import { stageLabel, statusClass, statusLabel } from "../lib/status";

export function ProjectPage() {
  const { projectId } = useParams();
  const typedProjectId = projectId as Id<"projects">;
  const data = useQuery(
    api.projects.get,
    projectId ? { projectId: typedProjectId } : "skip",
  );
  const sources = useQuery(
    api.sources.listForProject,
    projectId ? { projectId: typedProjectId } : "skip",
  );
  const graph = useQuery(
    api.dependencies.getGraph,
    projectId ? { projectId: typedProjectId } : "skip",
  );
  const documents = useQuery(
    api.documents.listForProject,
    projectId ? { projectId: typedProjectId } : "skip",
  );
  const evidenceLinks = useQuery(
    api.documents.listEvidenceForProject,
    projectId ? { projectId: typedProjectId } : "skip",
  );
  const communications = useQuery(
    api.communications.listForProject,
    projectId ? { projectId: typedProjectId } : "skip",
  );
  const extractions = useQuery(
    api.communications.listExtractionsForProject,
    projectId ? { projectId: typedProjectId } : "skip",
  );
  const approvals = useQuery(
    api.approvals.listPending,
    projectId ? { projectId: typedProjectId } : "skip",
  );
  const parameters = useQuery(
    api.parameters.listForProject,
    projectId ? { projectId: typedProjectId } : "skip",
  );
  const pendingChanges = useQuery(
    api.parameters.listPendingChanges,
    projectId ? { projectId: typedProjectId } : "skip",
  );
  const agentRuns = useQuery(
    api.agentRuns.listForProject,
    projectId ? { projectId: typedProjectId } : "skip",
  );

  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  const saveUploaded = useMutation(api.documents.saveUploaded);
  const approveDraft = useMutation(api.approvals.approve);
  const rejectDraft = useMutation(api.approvals.reject);
  const proposeChange = useMutation(api.parameters.proposeChange);
  const applyChange = useMutation(api.parameters.applyChange);
  const rejectChange = useMutation(api.parameters.rejectChange);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<Id<"sources"> | null>(null);
  const [proposedHeight, setProposedHeight] = useState("18");

  const selectedSnapshot = useMemo(() => {
    if (!selectedSourceId || !sources) {
      return null;
    }
    return sources.snapshots.find((item) => item.sourceId === selectedSourceId) ?? null;
  }, [selectedSourceId, sources]);

  const snapshotUrl = useQuery(
    api.sources.getSnapshotUrl,
    selectedSnapshot ? { snapshotId: selectedSnapshot._id } : "skip",
  );

  if (data === undefined) {
    return (
      <AppPageLayout signedIn wide>
        <p className="muted">Loading project...</p>
      </AppPageLayout>
    );
  }

  if (data === null) {
    return (
      <AppPageLayout signedIn wide>
        <p className="error">Project not found.</p>
        <Link className="button button-landing-secondary" to="/">
          Back home
        </Link>
      </AppPageLayout>
    );
  }

  const { project, stages, requirements, events } = data;
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);
  const sortedRequirements = [...requirements].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  const graphNodes = graph?.nodes ?? [];
  const childrenByParent = new Map<string, typeof graphNodes>();
  for (const edge of graph?.edges ?? []) {
    const children = childrenByParent.get(edge.fromNodeKey) ?? [];
    children.push(
      graphNodes.find((node) => node.nodeKey === edge.toNodeKey) ?? {
        nodeKey: edge.toNodeKey,
        title: edge.toNodeKey,
        status: "missing",
        verificationStatus: "unknown",
        isPrimaryBlocker: false,
        sourceLabel: undefined,
        sourceUrl: undefined,
        sourceExcerpt: undefined,
      },
    );
    childrenByParent.set(edge.fromNodeKey, children);
  }

  async function onUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!projectId) {
      return;
    }

    const form = event.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const typeInput = form.elements.namedItem("documentType") as HTMLSelectElement;
    const file = fileInput.files?.[0];
    if (!file) {
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      const uploadUrl = await generateUploadUrl({});
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = (await result.json()) as { storageId: Id<"_storage"> };
      await saveUploaded({
        projectId: typedProjectId,
        storageId,
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        documentType: typeInput.value,
      });
      form.reset();
    } catch (caught) {
      setUploadError(
        caught instanceof Error ? caught.message : "Upload failed.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function onProposeHeightChange() {
    await proposeChange({
      projectId: typedProjectId,
      parameterKey: "proposedAduHeightFt",
      proposedValue: proposedHeight,
    });
  }

  function renderGraphNode(nodeKey: string, depth = 0): ReactNode {
    const node = graphNodes.find((item) => item.nodeKey === nodeKey);
    if (!node) {
      return null;
    }
    const children = childrenByParent.get(nodeKey) ?? [];
    return (
      <div key={nodeKey} style={{ marginLeft: depth * 1.25 + "rem" }}>
        <div className="graph-node">
          <span>{node.title}</span>
          <span className={statusClass(node.status)}>{statusLabel(node.status)}</span>
        </div>
        {children.map((child) => renderGraphNode(child.nodeKey, depth + 1))}
      </div>
    );
  }

  return (
    <AppPageLayout signedIn wide>
      <div className="project-toolbar">
        <p className="mono muted project-toolbar-meta">
          {project.address} · {project.status}
        </p>
        <Link className="button button-landing-secondary button-sm" to="/projects/new">
          New project
        </Link>
      </div>

      {project.status === "compiling" ? (
        <div className="compiling-banner" style={{ marginBottom: "1rem" }}>
          Compiling project. Stages, sources, and events update live as the
          compiler runs.
        </div>
      ) : null}

      <section className="panel project-summary" style={{ marginBottom: "1rem" }}>
        <div className="header-grid">
          <div>
            <p className="landing-section-kicker">Control room</p>
            <h2 style={{ marginBottom: "0.35rem" }}>{project.title}</h2>
            <p className="muted" style={{ margin: 0 }}>{project.intent}</p>
            <p className="mono muted" style={{ marginTop: "0.75rem" }}>
              {project.jurisdiction ?? "Jurisdiction pending"} · Parcel{" "}
              {project.parcelId ?? "unknown"} · Zoning {project.zoning ?? "unknown"}
            </p>
            {project.inboxEmail ? (
              <p className="mono muted">Project inbox: {project.inboxEmail}</p>
            ) : null}
          </div>
          <div>
            <div className="muted mono">Permit readiness</div>
            <div className="readiness">{project.readinessPercent}%</div>
          </div>
        </div>
        <div className="compiler-stats">
          <span>Sources discovered: {project.sourcesDiscovered}</span>
          <span>Sources retrieved: {project.sourcesRetrieved}</span>
          <span>Rules extracted: {project.rulesExtracted}</span>
          <span>Blockers: {project.blockerCount}</span>
        </div>
      </section>

      <div className="project-layout">
        <aside className="panel stack">
          <h3>Permit graph</h3>
          {graphNodes.length ? (
            renderGraphNode("property")
          ) : (
            <p className="muted">Dependency graph pending compilation.</p>
          )}
        </aside>

        <section className="stack">
          <div className="panel">
            <h3>Compiler</h3>
            {sortedStages.map((stage) => (
              <div className="stage-row" key={stage._id}>
                <span className="mono">
                  {String(stage.order).padStart(2, "0")} {stage.label}
                </span>
                <span className="muted mono">{stageLabel(stage.status)}</span>
              </div>
            ))}
          </div>

          <div className="panel">
            <h3>Change impact</h3>
            <p className="muted">
              Propose a project parameter change and review impact before applying.
            </p>
            <div className="cta-row">
              <input
                value={proposedHeight}
                onChange={(event) => setProposedHeight(event.target.value)}
                placeholder="Proposed ADU height (ft)"
              />
              <button
                className="button button-landing-secondary"
                type="button"
                onClick={onProposeHeightChange}
              >
                Propose height change
              </button>
            </div>
            {pendingChanges?.map((change) => (
              <div className="impact-card" key={change._id}>
                <div className="mono">
                  {change.parameterKey}: {change.previousValue} → {change.proposedValue}
                </div>
                <p className="muted">
                  Requirements changed: {change.requirementsChanged} · Invalidated:{" "}
                  {change.requirementsInvalidated} · Documents affected:{" "}
                  {change.documentsAffected}
                </p>
                {change.blockerCreated ? (
                  <p className="error">{change.blockerCreated}</p>
                ) : null}
                <div className="cta-row">
                  <button
                    className="button button-landing-primary"
                    type="button"
                    onClick={() => applyChange({ changeSetId: change._id })}
                  >
                    Apply change
                  </button>
                  <button
                    className="button button-landing-secondary"
                    type="button"
                    onClick={() => rejectChange({ changeSetId: change._id })}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="panel">
            <h3>Official sources</h3>
            {sources?.sources.map((source) => {
              const snapshot = sources.snapshots.find(
                (item) => item.sourceId === source._id,
              );
              return (
                <button
                  className="source-row"
                  key={source._id}
                  type="button"
                  onClick={() => setSelectedSourceId(source._id)}
                >
                  <div>
                    <div>{source.label}</div>
                    <div className="mono muted">
                      {source.authority} · {source.healthStatus ?? "unknown"}
                      {source.monitorId ? " · monitored" : ""}
                    </div>
                    {snapshot ? (
                      <p className="muted" style={{ marginBottom: 0 }}>
                        {snapshot.title ?? "Snapshot retrieved"} · hash{" "}
                        {snapshot.contentHash.slice(0, 10)}
                      </p>
                    ) : (
                      <p className="muted" style={{ marginBottom: 0 }}>
                        Snapshot pending
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {selectedSourceId && selectedSnapshot ? (
            <div className="panel source-drawer">
              <h3>Source provenance</h3>
              <p className="mono muted">
                {sources?.sources.find((item) => item._id === selectedSourceId)?.label}
              </p>
              <p className="muted">{selectedSnapshot.markdownPreview.slice(0, 500)}...</p>
              {snapshotUrl ? (
                <a className="button button-landing-secondary" href={snapshotUrl} target="_blank" rel="noreferrer">
                  View captured version
                </a>
              ) : null}
            </div>
          ) : null}

          <div className="panel">
            <h3>Documents</h3>
            <form className="form-grid" onSubmit={onUpload}>
              <label>
                Document type
                <select name="documentType" defaultValue="site_plan">
                  <option value="site_plan">Site plan</option>
                  <option value="survey">Survey</option>
                  <option value="structural">Structural calculations</option>
                  <option value="existing_plans">Existing plans</option>
                  <option value="title_report">Title report</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label>
                File
                <input name="file" type="file" required />
              </label>
              {uploadError ? <p className="error">{uploadError}</p> : null}
              <button
                className="button button-landing-primary"
                type="submit"
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Upload evidence"}
              </button>
            </form>
            {documents?.map((document) => (
              <div className="event-row" key={document._id}>
                <div>
                  <div>{document.filename}</div>
                  <div className="muted mono">{document.documentType}</div>
                  {document.extractedFacts?.length ? (
                    <ul className="muted" style={{ marginBottom: 0 }}>
                      {document.extractedFacts.map((fact) => (
                        <li key={`${fact.label}-${fact.value}`}>
                          {fact.label}: {fact.value}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted" style={{ marginBottom: 0 }}>
                      Fact extraction pending
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="panel">
            <h3>Evidence mapping</h3>
            {evidenceLinks?.length ? (
              evidenceLinks.map((link) => {
                const requirement = sortedRequirements.find(
                  (item) => item._id === link.requirementId,
                );
                const document = documents?.find(
                  (item) => item._id === link.documentId,
                );
                return (
                  <div className="event-row" key={link._id}>
                    <div>
                      <div>{requirement?.title ?? "Requirement"}</div>
                      <div className="muted">
                        {document?.filename ?? "Document"} · {link.fact}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="muted">Upload documents to map evidence to requirements.</p>
            )}
          </div>
        </section>

        <aside className="panel stack">
          <h3>Next action</h3>
          <p>{project.nextAction ?? "Waiting for compiler output."}</p>

          <h3>Project parameters</h3>
          {parameters?.map((parameter) => (
            <div className="event-row" key={parameter._id}>
              <div className="mono">
                {parameter.key}: {parameter.value}
                {parameter.unit ? ` ${parameter.unit}` : ""}
              </div>
              <div className="muted">{parameter.verificationStatus}</div>
            </div>
          ))}

          <h3>Pending approvals</h3>
          {approvals?.length ? (
            approvals.map((approval) => (
              <div className="panel inner-panel" key={approval._id}>
                <div className="mono">{approval.subject}</div>
                {approval.factsUsed?.length ? (
                  <div>
                    <div className="muted mono">Facts used externally</div>
                    <ul className="muted">
                      {approval.factsUsed.map((fact) => (
                        <li key={fact}>{fact}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <pre className="draft-body">{approval.body}</pre>
                <div className="cta-row">
                  <button
                    className="button button-landing-primary"
                    type="button"
                    onClick={() => approveDraft({ approvalId: approval._id })}
                  >
                    Approve & send
                  </button>
                  <button
                    className="button button-landing-secondary"
                    type="button"
                    onClick={() => rejectDraft({ approvalId: approval._id })}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="muted">No pending approvals.</p>
          )}

          <h3>Inbox</h3>
          {communications?.length ? (
            communications.map((message) => (
              <div className="event-row" key={message._id}>
                <div>
                  <div className="mono">
                    {message.direction} · {message.status} ·{" "}
                    {message.deliveryStatus ?? "pending"}
                  </div>
                  <div>{message.subject}</div>
                  {message.classification ? (
                    <div className="muted mono">Classification: {message.classification}</div>
                  ) : null}
                  {message.detectedDecision ? (
                    <div className="muted">Decision: {message.detectedDecision}</div>
                  ) : null}
                  {message.projectImpact ? (
                    <div className="muted">Impact: {message.projectImpact}</div>
                  ) : null}
                  {message.linkedRequirementId ? (
                    <div className="mono muted">
                      Linked:{" "}
                      {sortedRequirements.find(
                        (item) => item._id === message.linkedRequirementId,
                      )?.title ?? message.linkedRequirementId}
                    </div>
                  ) : null}
                  <div className="muted">{message.body.slice(0, 180)}</div>
                </div>
              </div>
            ))
          ) : (
            <p className="muted">No correspondence yet.</p>
          )}

          {extractions?.length ? (
            <>
              <h3>Email extractions</h3>
              {extractions.map((extraction) => (
                <div className="event-row" key={extraction._id}>
                  <div className="mono">{extraction.extractionType}</div>
                  <div className="muted">{extraction.value}</div>
                </div>
              ))}
            </>
          ) : null}

          <h3>Agent runs</h3>
          {agentRuns?.map((run) => (
            <div className="event-row" key={run._id}>
              <div className="mono">{run.actionType} · {run.status}</div>
              <div className="muted">{run.message}</div>
            </div>
          ))}

          <h3>Event stream</h3>
          {events.map((event) => (
            <div className="event-row" key={event._id}>
              <div>
                <div className="mono">
                  {event.type} · {event.actorType}
                  {event.actorLabel ? ` · ${event.actorLabel}` : ""}
                </div>
                <div className="muted">{event.message}</div>
              </div>
            </div>
          ))}
        </aside>
      </div>
    </AppPageLayout>
  );
}
