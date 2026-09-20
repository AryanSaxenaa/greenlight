import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AppPageLayout } from "../components/AppPageLayout";
import { PageMeta } from "../components/PageMeta";

export function NotFoundPage() {
  const viewer = useQuery(api.users.viewer);
  const startHref = viewer ? "/projects/new" : "/auth";

  return (
    <AppPageLayout>
      <PageMeta
        title="Page not found"
        description="The page you requested could not be found."
        path="/404"
        noIndex
      />
      <div className="app-card app-card-narrow not-found-page">
        <p className="landing-section-kicker">404</p>
        <h1 className="app-card-title">This page isn&apos;t on the permit map.</h1>
        <p className="app-card-lead">
          The URL may be outdated or mistyped. Head back to Greenlight and start
          a new permitting project.
        </p>
        <div className="cta-row">
          <Link className="button button-landing-primary" to={startHref}>
            Start a project
          </Link>
          <Link className="button button-landing-secondary" to="/">
            Back to home
          </Link>
        </div>
      </div>
    </AppPageLayout>
  );
}
