import { useQuery } from "convex/react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { AppPageLayout } from "../components/AppPageLayout";
import { PageMeta } from "../components/PageMeta";
import { authRedirectPath } from "../lib/authRedirect";
import { projectStatusLabel } from "../lib/status";

export function ProjectsPage() {
  const location = useLocation();
  const viewer = useQuery(api.users.viewer);
  const projects = useQuery(api.projects.list, viewer ? {} : "skip");

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
      <div className="app-card">
        <p className="landing-section-kicker">Dashboard</p>
        <h2 className="app-card-title">Your projects</h2>
        <p className="app-card-lead">
          Open a control room to track permit readiness, sources, and agency
          correspondence.
        </p>

        {projects.length === 0 ? (
          <div className="project-list-empty">
            <p className="muted">No projects yet.</p>
            <Link className="button button-landing-primary" to="/projects/new">
              Start a project
            </Link>
          </div>
        ) : (
          <ul className="project-list">
            {projects.map((project) => (
              <li key={project._id}>
                <Link className="project-list-row" to={`/projects/${project._id}`}>
                  <div>
                    <div className="project-list-title">{project.title}</div>
                    <div className="muted mono project-list-address">
                      {project.address}
                    </div>
                  </div>
                  <div className="project-list-meta">
                    <span className="mono">{project.readinessPercent}% ready</span>
                    <span className="muted mono">
                      {projectStatusLabel(project.status)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {projects.length > 0 ? (
          <div className="cta-row" style={{ marginTop: "1.25rem" }}>
            <Link className="button button-landing-primary" to="/projects/new">
              New project
            </Link>
          </div>
        ) : null}
      </div>
    </AppPageLayout>
  );
}
