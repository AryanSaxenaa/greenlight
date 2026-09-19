import { useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";

export function LandingPage() {
  const viewer = useQuery(api.users.viewer);

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span>GREENLIGHT</span>
        </div>
        <Link className="button button-secondary" to={viewer ? "/projects/new" : "/auth"}>
          {viewer ? "New project" : "Sign in"}
        </Link>
      </header>

      <main className="hero">
        <h1>Get your project permit-ready.</h1>
        <p>
          Greenlight researches your jurisdiction, compiles the requirements,
          identifies blockers, and manages the path to approval.
        </p>
        <div className="cta-row">
          <Link
            className="button button-primary"
            to={viewer ? "/projects/new" : "/auth"}
          >
            Start a project
          </Link>
          <a
            className="button button-secondary"
            href="https://github.com/AryanSaxenaa/greenlight"
            target="_blank"
            rel="noreferrer"
          >
            View repository
          </a>
        </div>
      </main>
    </div>
  );
}
