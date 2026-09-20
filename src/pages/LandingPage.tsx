import { useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { AppHeader } from "../components/AppHeader";

export function LandingPage() {
  const viewer = useQuery(api.users.viewer);

  return (
    <div className="page page-landing">
      <div className="shell">
        <AppHeader
          action={
            <Link className="button button-secondary button-sm" to={viewer ? "/projects/new" : "/auth"}>
              {viewer ? "New project" : "Sign in"}
            </Link>
          }
        />

        <main className="hero-landing">
          <div className="hero-visual" aria-hidden="true">
            <img
              className="hero-bg-art"
              src="/background-asset.jpg"
              alt=""
            />
            <div className="hero-highlight" />
            <div className="hero-rocks" />
          </div>

          <div className="hero-copy">
            <p className="eyebrow">Los Angeles residential permitting</p>
            <h1>
              <span className="hero-line-muted">Get your project</span>
              <span className="hero-line-strong">permit-ready.</span>
            </h1>
            <p className="hero-lede">
              Greenlight researches your jurisdiction, compiles requirements,
              identifies blockers, and manages the path to approval — with human
              oversight at every agency touchpoint.
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
          </div>
        </main>

        <section className="feature-strip">
          <article className="feature-card">
            <span className="feature-index">01</span>
            <h3>Compile</h3>
            <p>Crawl official LADBS and City Planning sources into a live permit graph.</p>
          </article>
          <article className="feature-card">
            <span className="feature-index">02</span>
            <h3>Track</h3>
            <p>Map evidence to requirements and surface blockers before plan check.</p>
          </article>
          <article className="feature-card">
            <span className="feature-index">03</span>
            <h3>Correspond</h3>
            <p>Draft clarification emails, approve before send, ingest agency replies.</p>
          </article>
        </section>
      </div>
    </div>
  );
}
