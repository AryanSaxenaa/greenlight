import { Link, useParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { stageLabel, statusClass, statusLabel } from "../lib/status";

export function ProjectPage() {
  const { projectId } = useParams();
  const data = useQuery(
    api.projects.get,
    projectId ? { projectId: projectId as Id<"projects"> } : "skip",
  );

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
          Compiling project. Stages and events update live as the compiler runs.
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
          {sortedRequirements.length === 0 ? (
            <p className="muted">Requirements appear after compilation.</p>
          ) : null}
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
            <h3>Property resolution</h3>
            <div className="stack mono">
              <div>Address: {project.normalizedAddress ?? project.address}</div>
              <div>
                Jurisdiction: {project.jurisdiction ?? "Pending / unsupported"}
              </div>
              <div>City: {project.city ?? "—"}</div>
              <div>County: {project.county ?? "—"}</div>
              <div>State: {project.state ?? "—"}</div>
            </div>
          </div>

          {project.primaryBlocker ? (
            <div className="panel">
              <h3>Primary blocker</h3>
              <p style={{ marginTop: 0 }}>{project.primaryBlocker}</p>
              {project.primaryBlockerReason ? (
                <p className="muted">{project.primaryBlockerReason}</p>
              ) : null}
              {project.primaryBlockerSource ? (
                <p className="mono muted">Source: {project.primaryBlockerSource}</p>
              ) : null}
            </div>
          ) : null}
        </section>

        <aside className="panel stack">
          <h3>Next action</h3>
          <p>{project.nextAction ?? "Waiting for compiler output."}</p>
          <div className="mono muted">
            <div>Requirements: {project.requirementCount}</div>
            <div>Blockers: {project.blockerCount}</div>
            <div>Unknown: {project.unknownCount}</div>
            <div>Permit path stages: {project.permitPathStages}</div>
          </div>

          <h3>Event stream</h3>
          {events.map((event) => (
            <div className="event-row" key={event._id}>
              <div>
                <div className="mono">{event.type}</div>
                <div className="muted">{event.message}</div>
              </div>
            </div>
          ))}
          {events.length === 0 ? (
            <p className="muted">No events yet.</p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
