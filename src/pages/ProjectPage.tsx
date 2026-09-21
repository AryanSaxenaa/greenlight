import { useMutation, useQuery } from "convex/react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { AppPageLayout } from "../components/AppPageLayout";
import { ControlRoomCompiler } from "../components/ControlRoomCompiler";
import { DashDisclosure } from "../components/DashDisclosure";
import { DashSection } from "../components/DashSection";
import {
  ProjectCommandStrip,
  ProjectWorkspaceTabs,
} from "../components/ProjectCommandStrip";
import { ProjectPermitGraph, type PermitGraphNode } from "../components/ProjectPermitGraph";
import { QueryErrorBoundary } from "../components/QueryErrorBoundary";
import { authRedirectPath } from "../lib/authRedirect";
import { eventTone, formatEventMessage } from "../lib/eventMessages";
import { formatConvexError, isConvexId } from "../lib/errors";
import { stageLabel } from "../lib/status";

export function ProjectPage() {
  const { projectId } = useParams();
  const location = useLocation();
  const viewer = useQuery(api.users.viewer);

  if (viewer === null) {
    return (
      <Navigate
        to={authRedirectPath(`${location.pathname}${location.search}`)}
        replace
      />
    );
  }

  if (viewer === undefined) {
    return (
      <AppPageLayout>
        <p className="muted">Checking session...</p>
      </AppPageLayout>
    );
  }

  if (!isConvexId(projectId)) {
    return (
      <AppPageLayout wide>
        <p className="error">Project not found.</p>
        <Link className="button button-landing-secondary" to="/projects">
          Back to dashboard
        </Link>
      </AppPageLayout>
    );
  }

  return (
    <QueryErrorBoundary>
      <ProjectPageContent projectId={projectId as Id<"projects">} />
    </QueryErrorBoundary>
  );
}

function ProjectPageContent({ projectId }: { projectId: Id<"projects"> }) {
  const data = useQuery(api.projects.get, { projectId });
  const sources = useQuery(api.sources.listForProject, { projectId });
  const graph = useQuery(api.dependencies.getGraph, { projectId });
  const documents = useQuery(api.documents.listForProject, { projectId });
  const evidenceLinks = useQuery(
    api.documents.listEvidenceForProject,
    { projectId },
  );
  const communications = useQuery(
    api.communications.listForProject,
    { projectId },
  );
  const extractions = useQuery(
    api.communications.listExtractionsForProject,
    { projectId },
  );
  const approvals = useQuery(api.approvals.listPending, { projectId });
  const parameters = useQuery(api.parameters.listForProject, { projectId });
  const pendingChanges = useQuery(
    api.parameters.listPendingChanges,
    { projectId },
  );
  const agentRuns = useQuery(api.agentRuns.listForProject, { projectId });

  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  const saveUploaded = useMutation(api.documents.saveUploaded);
  const approveDraft = useMutation(api.approvals.approve);
  const rejectDraft = useMutation(api.approvals.reject);
  const proposeChange = useMutation(api.parameters.proposeChange);
  const applyChange = useMutation(api.parameters.applyChange);
  const rejectChange = useMutation(api.parameters.rejectChange);
  const repairGraph = useMutation(api.projects.repairGraph);

  const [uploading, setUploading] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<Id<"sources"> | null>(null);
  const [proposedHeight, setProposedHeight] = useState("18");
  const [workspaceTab, setWorkspaceTab] = useState<
    "overview" | "evidence" | "sources" | "activity"
  >("overview");

  useEffect(() => {
    if (!data || data.project.status !== "active") {
      return;
    }

    const hasExtractedDocuments = documents?.some(
      (document) => (document.extractedFacts?.length ?? 0) > 0,
    );
    const needsPathway = data.requirements.length < 9;
    const needsGraph = graph && graph.nodes.length > 0 && graph.edges.length === 0;
    const needsEvidenceRelink =
      Boolean(hasExtractedDocuments) && (evidenceLinks?.length ?? 0) === 0;

    if (needsPathway || needsGraph || needsEvidenceRelink) {
      void repairGraph({ projectId });
    }
  }, [data, documents, evidenceLinks, graph, projectId, repairGraph]);

  async function runAction(action: () => Promise<void>) {
    if (actionPending) {
      return;
    }
    setActionPending(true);
    setActionError(null);
    try {
      await action();
    } catch (caught) {
      setActionError(formatConvexError(caught));
    } finally {
      setActionPending(false);
    }
  }

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
      <AppPageLayout wide>
        <p className="muted">Loading project...</p>
      </AppPageLayout>
    );
  }

  if (data === null) {
    return (
      <AppPageLayout wide>
        <p className="error">Project not found.</p>
        <Link className="button button-landing-secondary" to="/projects">
          Back to dashboard
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
  const graphLoading = graph === undefined;
  const displayGraphNodes: PermitGraphNode[] =
    graphNodes.length > 0
      ? graphNodes.map((node) => ({
          nodeKey: node.nodeKey,
          title: node.title,
          status: node.status,
          isPrimaryBlocker: node.isPrimaryBlocker,
          sourceLabel: node.sourceLabel,
        }))
      : sortedRequirements.map((requirement) => ({
          nodeKey: requirement.nodeKey,
          title: requirement.title,
          status: requirement.status,
          isPrimaryBlocker: requirement.isPrimaryBlocker,
        }));
  const eligibleRequirements = sortedRequirements.filter(
    (requirement) => requirement.status !== "locked",
  );
  const verifiedRequirements = eligibleRequirements.filter(
    (requirement) => requirement.status === "verified",
  );
  const compilerComplete = sortedStages.every((stage) => stage.status === "complete");

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
      setUploadError("Choose a file to upload.");
      return;
    }

    setUploading(true);
    setUploadError(null);
    setActionError(null);
    try {
      const uploadUrl = await generateUploadUrl({});
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!result.ok) {
        throw new Error(`Upload failed (${result.status}).`);
      }
      const payload = (await result.json()) as { storageId?: Id<"_storage"> };
      if (!payload.storageId) {
        throw new Error("Upload failed. No file was stored.");
      }
      await saveUploaded({
        projectId,
        storageId: payload.storageId,
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        documentType: typeInput.value,
      });
      form.reset();
    } catch (caught) {
      setUploadError(formatConvexError(caught));
    } finally {
      setUploading(false);
    }
  }

  async function onProposeHeightChange() {
    await runAction(async () => {
      await proposeChange({
        projectId,
        parameterKey: "proposedAduHeightFt",
        proposedValue: proposedHeight,
      });
    });
  }

  const readinessHint =
    project.readinessPercent === 0 && compilerComplete
      ? "Compiler finished. Upload evidence to increase readiness."
      : "Verified requirements unlock permit submission.";

  const pendingApprovalCount = approvals?.length ?? 0;
  const activityCount =
    pendingApprovalCount +
    (communications?.length ?? 0) +
    (agentRuns?.filter((run) => run.status === "running").length ?? 0);

  const projectDetails = [
    { label: "Intent", value: project.intent },
    { label: "Jurisdiction", value: project.jurisdiction ?? "Pending" },
    { label: "Parcel", value: project.parcelId ?? "unknown" },
    { label: "Zoning", value: project.zoning ?? "unknown" },
    ...(project.inboxEmail
      ? [{ label: "Project inbox", value: project.inboxEmail }]
      : []),
  ];

  return (
    <AppPageLayout wide>
      <div className="dash-project project-workspace">
        <ProjectCommandStrip
          title={project.title}
          address={project.address}
          readinessPercent={project.readinessPercent}
          readinessHint={readinessHint}
          verifiedCount={verifiedRequirements.length}
          eligibleCount={eligibleRequirements.length}
          nextAction={project.nextAction}
          compiling={project.status === "compiling"}
          pendingApprovals={pendingApprovalCount}
          onShowActivity={() => setWorkspaceTab("activity")}
          metrics={[
            { value: project.sourcesDiscovered, label: "sources" },
            { value: project.sourcesRetrieved, label: "retrieved" },
            { value: project.rulesExtracted, label: "rules" },
            { value: project.blockerCount, label: "blockers" },
          ]}
          details={projectDetails}
          actions={
            <div className="cta-row project-command-links">
              <Link className="button dash-button-secondary" to="/projects">
                All projects
              </Link>
              <button
                className="button dash-button-primary"
                type="button"
                onClick={() => setWorkspaceTab("evidence")}
              >
                Upload evidence
              </button>
            </div>
          }
        />

        {actionError ? <p className="error action-error">{actionError}</p> : null}

        <ProjectWorkspaceTabs
          active={workspaceTab}
          onChange={(tab) => setWorkspaceTab(tab as typeof workspaceTab)}
          tabs={[
            { id: "overview", label: "Overview" },
            {
              id: "evidence",
              label: "Evidence",
              badge: (documents?.length ?? 0) + (pendingChanges?.length ?? 0),
            },
            { id: "sources", label: "Sources", badge: sources?.sources.length ?? 0 },
            { id: "activity", label: "Activity", badge: activityCount },
          ]}
        />

        <div className="project-workspace-panel" role="tabpanel">
          {workspaceTab === "overview" ? (
            <div className="project-overview-grid">
              <ProjectPermitGraph
                variant="light"
                compact
                nodes={displayGraphNodes}
                loading={graphLoading}
                readinessPercent={project.readinessPercent}
              />

              <div className="project-overview-side">
                <ControlRoomCompiler
                  compact
                  stages={sortedStages}
                  stageLabel={stageLabel}
                />

                <DashDisclosure
                  title="Project parameters"
                  meta={`${parameters?.length ?? 0} tracked`}
                >
                  <div className="parameter-list">
                    {parameters?.map((parameter) => (
                      <div className="parameter-row" key={parameter._id}>
                        <div className="mono parameter-key">
                          {parameter.key}: {parameter.value}
                          {parameter.unit ? ` ${parameter.unit}` : ""}
                        </div>
                        <span
                          className={`parameter-badge parameter-badge-${parameter.verificationStatus}`}
                        >
                          {parameter.verificationStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                </DashDisclosure>
              </div>
            </div>
          ) : null}

          {workspaceTab === "evidence" ? (
            <div className="project-stack">
              <DashSection variant="module" kicker="Evidence" title="Upload documents">
                <form className="evidence-upload-form" onSubmit={onUpload}>
                  <div className="evidence-upload-row">
                    <label className="evidence-upload-field">
                      <span className="evidence-upload-label">Document type</span>
                      <select name="documentType" defaultValue="site_plan">
                        <option value="site_plan">Site plan</option>
                        <option value="survey">Survey</option>
                        <option value="structural">Structural calculations</option>
                        <option value="existing_plans">Existing plans</option>
                        <option value="title_report">Title report</option>
                        <option value="other">Other</option>
                      </select>
                    </label>
                    <label className="evidence-upload-field evidence-upload-field-file">
                      <span className="evidence-upload-label">File</span>
                      <input name="file" type="file" required />
                    </label>
                    <div className="evidence-upload-action">
                      <button
                        className="button dash-button-primary evidence-upload-button"
                        type="submit"
                        disabled={uploading}
                      >
                        {uploading ? "Uploading..." : "Upload evidence"}
                      </button>
                    </div>
                  </div>
                  {uploadError ? <p className="error">{uploadError}</p> : null}
                </form>
              </DashSection>

              <DashDisclosure
                title="Uploaded documents"
                meta={`${documents?.length ?? 0} files`}
                defaultOpen={(documents?.length ?? 0) > 0}
              >
                {documents?.length ? (
                  documents.map((document) => (
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
                  ))
                ) : (
                  <p className="muted">No documents uploaded yet.</p>
                )}
              </DashDisclosure>

              <DashDisclosure
                title="Evidence links"
                meta={`${evidenceLinks?.length ?? 0} mapped`}
                defaultOpen={(evidenceLinks?.length ?? 0) > 0}
              >
                {evidenceLinks?.length ? (
                  evidenceLinks.map((link) => {
                    const requirement = sortedRequirements.find(
                      (item) => item._id === link.requirementId,
                    );
                    const document = documents?.find((item) => item._id === link.documentId);
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
              </DashDisclosure>

              <DashDisclosure
                title="Parameter changes"
                meta={`${pendingChanges?.length ?? 0} pending`}
                defaultOpen={(pendingChanges?.length ?? 0) > 0}
              >
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
                    onClick={() => void onProposeHeightChange()}
                  >
                    Propose height change
                  </button>
                </div>
                {pendingChanges?.map((change) => (
                  <div className="dash-module-item impact-card" key={change._id}>
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
                        disabled={actionPending}
                        onClick={() =>
                          void runAction(async () => {
                            await applyChange({ changeSetId: change._id });
                          })
                        }
                      >
                        Apply change
                      </button>
                      <button
                        className="button button-landing-secondary"
                        type="button"
                        disabled={actionPending}
                        onClick={() =>
                          void runAction(async () => {
                            await rejectChange({ changeSetId: change._id });
                          })
                        }
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </DashDisclosure>
            </div>
          ) : null}

          {workspaceTab === "sources" ? (
            <div className="project-stack">
              <DashSection kicker="Official sources" title="Agency research">
                <div className="source-list">
                  {sources?.sources.map((source) => {
                    const snapshot = sources.snapshots.find(
                      (item) => item.sourceId === source._id,
                    );
                    return (
                      <button
                        className={`source-row source-row-${source.healthStatus ?? "unknown"}`}
                        key={source._id}
                        type="button"
                        onClick={() => setSelectedSourceId(source._id)}
                      >
                        <div>
                          <div className="source-row-title">{source.label}</div>
                          <div className="mono source-row-meta">
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
              </DashSection>

              {selectedSourceId && selectedSnapshot ? (
                <DashSection variant="module" className="source-drawer" title="Source provenance">
                  <p className="mono muted">
                    {sources?.sources.find((item) => item._id === selectedSourceId)?.label}
                  </p>
                  <p className="muted">{selectedSnapshot.markdownPreview.slice(0, 500)}...</p>
                  {snapshotUrl ? (
                    <a
                      className="button button-landing-secondary"
                      href={snapshotUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View captured version
                    </a>
                  ) : null}
                </DashSection>
              ) : null}
            </div>
          ) : null}

          {workspaceTab === "activity" ? (
            <div className="project-activity-grid">
              <DashDisclosure
                title="Pending approvals"
                meta={`${pendingApprovalCount} waiting`}
                defaultOpen={pendingApprovalCount > 0}
              >
                {approvals?.length ? (
                  approvals.map((approval) => (
                    <div className="dash-module-item inner-panel" key={approval._id}>
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
                          disabled={actionPending}
                          onClick={() =>
                            void runAction(async () => {
                              await approveDraft({ approvalId: approval._id });
                            })
                          }
                        >
                          Approve & send
                        </button>
                        <button
                          className="button button-landing-secondary"
                          type="button"
                          disabled={actionPending}
                          onClick={() =>
                            void runAction(async () => {
                              await rejectDraft({ approvalId: approval._id });
                            })
                          }
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="muted">No pending approvals.</p>
                )}
              </DashDisclosure>

              <DashDisclosure
                title="Agency mail"
                meta={`${communications?.length ?? 0} messages`}
                defaultOpen={(communications?.length ?? 0) > 0}
              >
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
                          <div className="muted mono">
                            Classification: {message.classification}
                          </div>
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
              </DashDisclosure>

              {extractions?.length ? (
                <DashDisclosure title="Email extractions" meta={`${extractions.length} parsed`}>
                  {extractions.map((extraction) => (
                    <div className="event-row" key={extraction._id}>
                      <div className="mono">{extraction.extractionType}</div>
                      <div className="muted">{extraction.value}</div>
                    </div>
                  ))}
                </DashDisclosure>
              ) : null}

              <DashDisclosure title="Background runs" meta={`${agentRuns?.length ?? 0} runs`}>
                {agentRuns?.length ? (
                  agentRuns.map((run) => (
                    <div className="event-row" key={run._id}>
                      <div className="mono">
                        {run.actionType} · {run.status}
                      </div>
                      <div className="muted">{run.message}</div>
                    </div>
                  ))
                ) : (
                  <p className="muted">No agent runs yet.</p>
                )}
              </DashDisclosure>

              <DashDisclosure
                title="Event stream"
                meta={`${events.length} events`}
                defaultOpen={events.length <= 8}
              >
                <div className="event-stream">
                  {events.map((event) => (
                    <div
                      className={`event-card event-card-${eventTone(event.type)}`}
                      key={event._id}
                    >
                      <div className="event-card-type mono">
                        {event.type} · {event.actorType}
                        {event.actorLabel ? ` · ${event.actorLabel}` : ""}
                      </div>
                      <div className="event-card-message">{formatEventMessage(event)}</div>
                    </div>
                  ))}
                </div>
              </DashDisclosure>
            </div>
          ) : null}
        </div>
      </div>
    </AppPageLayout>
  );
}
