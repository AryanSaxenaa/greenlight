import { useMutation, useQuery } from "convex/react";
import { FormEvent, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
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
  const approvals = useQuery(
    api.approvals.listPending,
    projectId ? { projectId: typedProjectId } : "skip",
  );

  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  const saveUploaded = useMutation(api.documents.saveUploaded);
  const approveDraft = useMutation(api.approvals.approve);
  const rejectDraft = useMutation(api.approvals.reject);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (data === undefined) {
    return (
      <div className="shell">
        <p className="muted">Loading project...</p>
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="shell">
        <p className="error">Project not found.</p>
        <Link className="button button-secondary" to="/">
          Back home
        </Link>
      </div>
    );
  }

  const { project, stages, requirements, events } = data;
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);
  const sortedRequirements = [...requirements].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

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

  return (
    <div className="shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark" aria-hidden="true" />
          <span>GREENLIGHT</span>
        </Link>
        <div className="mono muted">
          {project.address} · {project.status}
        </div>
      </header>

      {project.status === "compiling" ? (
        <div className="compiling-banner" style={{ marginBottom: "1rem" }}>
          Compiling project. Stages, sources, and events update live as the
          compiler runs.
        </div>
      ) : null}

      <section className="panel" style={{ marginBottom: "1rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2 style={{ marginBottom: "0.35rem" }}>{project.title}</h2>
            <p className="muted" style={{ margin: 0 }}>{project.intent}</p>
            {project.inboxEmail ? (
              <p className="mono muted" style={{ marginTop: "0.75rem" }}>
                Project inbox: {project.inboxEmail}
              </p>
            ) : null}
          </div>
          <div>
            <div className="muted mono">Permit readiness</div>
            <div className="readiness">{project.readinessPercent}%</div>
          </div>
        </div>
      </section>

      <div className="project-layout">
        <aside className="panel stack">
          <h3>Project graph</h3>
          {sortedRequirements.map((requirement) => (
            <div className="requirement-row" key={requirement._id}>
              <div>
                <div>{requirement.title}</div>
                <div className="muted mono">{requirement.category}</div>
              </div>
              <span className={statusClass(requirement.status)}>
                {statusLabel(requirement.status)}
              </span>
            </div>
          ))}
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
            <h3>Official sources</h3>
            {sources?.sources.map((source) => {
              const snapshot = sources.snapshots.find(
                (item) => item.sourceId === source._id,
              );
              return (
                <div className="requirement-row" key={source._id}>
                  <div>
                    <div>{source.label}</div>
                    <a
                      className="mono muted"
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {source.authority}
                    </a>
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
                </div>
              );
            })}
          </div>

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
                  <option value="other">Other</option>
                </select>
              </label>
              <label>
                File
                <input name="file" type="file" required />
              </label>
              {uploadError ? <p className="error">{uploadError}</p> : null}
              <button
                className="button button-primary"
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

          {project.primaryBlocker ? (
            <div className="panel">
              <h3>Primary blocker</h3>
              <p style={{ marginTop: 0 }}>{project.primaryBlocker}</p>
              {project.primaryBlockerReason ? (
                <p className="muted">{project.primaryBlockerReason}</p>
              ) : null}
              {project.primaryBlockerSource ? (
                <p className="mono muted">
                  Source: {project.primaryBlockerSource}
                </p>
              ) : null}
            </div>
          ) : null}
        </section>

        <aside className="panel stack">
          <h3>Next action</h3>
          <p>{project.nextAction ?? "Waiting for compiler output."}</p>

          <h3>Pending approvals</h3>
          {approvals?.length ? (
            approvals.map((approval) => (
              <div className="panel" key={approval._id} style={{ padding: "0.85rem" }}>
                <div className="mono">{approval.subject}</div>
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.78rem",
                  }}
                >
                  {approval.body}
                </pre>
                <div className="cta-row">
                  <button
                    className="button button-primary"
                    type="button"
                    onClick={() => approveDraft({ approvalId: approval._id })}
                  >
                    Approve & send
                  </button>
                  <button
                    className="button button-secondary"
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
                    {message.direction} · {message.status}
                  </div>
                  <div>{message.subject}</div>
                  {message.linkedRequirementId ? (
                    <div className="mono muted">
                      Linked requirement:{" "}
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

          <h3>Event stream</h3>
          {events.map((event) => (
            <div className="event-row" key={event._id}>
              <div>
                <div className="mono">{event.type}</div>
                <div className="muted">{event.message}</div>
              </div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
