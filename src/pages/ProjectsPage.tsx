import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { AppPageLayout } from "../components/AppPageLayout";
import { DashPageHeader } from "../components/DashPageHeader";
import { PageMeta } from "../components/PageMeta";
import { authRedirectPath } from "../lib/authRedirect";
import { projectStatusLabel } from "../lib/status";

function formatRelativeTime(timestamp: number): string {
  const delta = Date.now() - timestamp;
  const minutes = Math.floor(delta / 60000);
  if (minutes < 1) {
    return "Just now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 48) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ProjectsPage() {
  const location = useLocation();
  const viewer = useQuery(api.users.viewer);
  const projects = useQuery(api.projects.list, viewer ? {} : "skip");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredProjects = useMemo(() => {
    if (!projects) {
      return [];
    }

    return projects.filter((project) => {
      const matchesQuery =
        query.trim().length === 0 ||
        project.title.toLowerCase().includes(query.toLowerCase()) ||
        project.address.toLowerCase().includes(query.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || project.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [projects, query, statusFilter]);

  if (viewer === null) {
    return (
      <Navigate
        to={authRedirectPath(`${location.pathname}${location.search}`)}
        replace
      />
    );
  }

  if (viewer === undefined || projects === undefined) {
    return (
      <AppPageLayout>
        <p className="muted">Loading projects...</p>
      </AppPageLayout>
    );
  }

  return (
    <AppPageLayout>
      <PageMeta
        title="Dashboard"
        description="Manage your Los Angeles permitting projects."
        path="/projects"
        noIndex
      />

      <DashPageHeader
        title="Projects"
        description={
          <>
            Each project opens a live control room for permit readiness, official sources,
            and agency correspondence.{" "}
            <Link to="/projects/new">Start a project</Link>
          </>
        }
        actions={
          <Link className="button dash-button-primary" to="/projects/new">
            New project
          </Link>
        }
      />

      <div className="dash-toolbar">
        <label className="dash-search">
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects"
            aria-label="Search projects"
          />
        </label>

        <label className="dash-filter">
          <span>Status</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            <option value="compiling">Compiling</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </div>

      <div className="dash-table-shell">
        <div className="dash-table-head">
          <span>Project</span>
          <span>Address</span>
          <span>Readiness</span>
          <span>Status</span>
          <span>Activity</span>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty-icon" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24">
                <path d="M7 4h10v16H7z" fill="none" stroke="currentColor" strokeWidth="1.4" />
                <path d="M9 2.5h6v2H9z" fill="none" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </div>
            <strong>No projects yet</strong>
            <p>Create your first LA permit project to compile requirements and track readiness.</p>
            <Link className="button dash-button-primary" to="/projects/new">
              Start a project
            </Link>
          </div>
        ) : (
          <ul className="dash-table-body">
            {filteredProjects.map((project) => (
              <li key={project._id}>
                <Link className="dash-table-row" to={`/projects/${project._id}`}>
                  <span className="dash-table-project">
                    <strong>{project.title}</strong>
                    <span>{project.intent}</span>
                  </span>
                  <span className="dash-table-address">{project.address}</span>
                  <span className="dash-table-readiness">
                    <span className="dash-readiness-bar" aria-hidden="true">
                      <i style={{ width: `${project.readinessPercent}%` }} />
                    </span>
                    {project.readinessPercent}%
                  </span>
                  <span className="dash-status-pill">{projectStatusLabel(project.status)}</span>
                  <span className="dash-table-activity">
                    {formatRelativeTime(project.updatedAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppPageLayout>
  );
}
