import { useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { LandingFooter } from "../components/LandingFooter";
import { LandingHeader } from "../components/LandingHeader";

const STEPS = [
  {
    index: "01",
    title: "Describe your project",
    body:
      "Tell Greenlight what you want to build and where. A garage conversion, backyard ADU, or addition, in plain language, with your LA address.",
    icon: "intent",
  },
  {
    index: "02",
    title: "Compile the permit graph",
    body:
      "Firecrawl crawls LADBS and City Planning pages; OpenAI via Convex AI Gateway extracts structured requirements into your live permit graph.",
    icon: "graph",
  },
  {
    index: "03",
    title: "Stay permit-ready",
    body:
      "Track blockers, upload evidence for AI fact extraction, and approve OpenAI-drafted agency emails before they send. Every touchpoint stays human-reviewed.",
    icon: "ready",
  },
];

const FEATURES = [
  {
    title: "Live permit graph",
    body:
      "Requirements, dependencies, and blockers update in one view, not scattered across PDFs, portals, and email threads.",
    tone: "forest",
    icon: "graph",
  },
  {
    title: "OpenAI requirement extraction",
    body:
      "After Firecrawl captures official LADBS and planning pages, OpenAI via Convex AI Gateway turns markdown into structured requirements with statuses and dependencies.",
    tone: "sage",
    icon: "sources",
  },
  {
    title: "Agency correspondence",
    body:
      "OpenAI drafts clarification emails and parses inbound agency replies. AgentMail sends only after your approval and syncs threads back into the project record.",
    tone: "ochre",
    icon: "mail",
  },
  {
    title: "Document intelligence",
    body:
      "Upload site plans and surveys; OpenAI extracts structured facts and maps evidence to requirements so plan check gaps surface early.",
    tone: "ink",
    icon: "approve",
  },
];

const TRUST_POINTS = [
  {
    title: "Approval before send",
    body: "No agency email leaves without your explicit sign-off.",
  },
  {
    title: "Scoped project data",
    body: "Documents, drafts, and extractions stay tied to your account.",
  },
  {
    title: "Auditable trail",
    body: "Every compiler run, OpenAI extraction, source crawl, and status change is logged.",
  },
];

function FeatureIcon({ type }: { type: string }) {
  if (type === "graph") {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <circle cx="4" cy="9" r="2" fill="none" stroke="currentColor" strokeWidth="1.1" />
        <circle cx="14" cy="4" r="2" fill="none" stroke="currentColor" strokeWidth="1.1" />
        <circle cx="14" cy="14" r="2" fill="none" stroke="currentColor" strokeWidth="1.1" />
        <line x1="5.6" y1="8.2" x2="12.2" y2="5.1" stroke="currentColor" strokeWidth="1" />
        <line x1="5.6" y1="9.8" x2="12.2" y2="12.9" stroke="currentColor" strokeWidth="1" />
      </svg>
    );
  }
  if (type === "sources") {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <rect x="3" y="2.5" width="9" height="12" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1.1" />
        <rect x="6" y="5.5" width="9" height="12" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1.1" />
        <line x1="5" y1="6" x2="10" y2="6" stroke="currentColor" strokeWidth="0.9" />
        <line x1="5" y1="8.5" x2="9" y2="8.5" stroke="currentColor" strokeWidth="0.9" />
        <line x1="8" y1="9" x2="13" y2="9" stroke="currentColor" strokeWidth="0.9" />
        <line x1="8" y1="11.5" x2="12" y2="11.5" stroke="currentColor" strokeWidth="0.9" />
      </svg>
    );
  }
  if (type === "mail") {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <rect x="2.5" y="4.5" width="13" height="9" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1.1" />
        <path d="M3 5.5l6 4.5 6-4.5" fill="none" stroke="currentColor" strokeWidth="1" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M9 2.5L14.5 5v5.5c0 2-1.4 3.4-3.5 4.5C8.9 14.4 7.5 13 7.5 11V5L9 2.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <path d="M6.8 9l1.6 1.6 2.8-3.2" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

function StepIcon({ type }: { type: string }) {
  if (type === "intent") {
    return (
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
        <rect x="4" y="3" width="14" height="16" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <line x1="7" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1" />
        <line x1="7" y1="11" x2="13" y2="11" stroke="currentColor" strokeWidth="1" />
      </svg>
    );
  }
  if (type === "graph") {
    return (
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
        <circle cx="5" cy="11" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="17" cy="5" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="17" cy="17" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <line x1="7" y1="10" x2="14.5" y2="6.5" stroke="currentColor" strokeWidth="1" />
        <line x1="7" y1="12" x2="14.5" y2="15.5" stroke="currentColor" strokeWidth="1" />
      </svg>
    );
  }
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <path d="M11 3L18 7v8l-7 4-7-4V7l7-4z" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8.5 11l2 2 3.5-4" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function LandingPage() {
  const viewer = useQuery(api.users.viewer);
  const signedIn = Boolean(viewer);
  const startHref = signedIn ? "/projects" : "/auth";

  return (
    <div className="page page-landing">
      <div className="landing-hero-wrap">
        <div className="landing-bg" aria-hidden="true">
          <img
            className="landing-bg-image"
            src="/hero-background.jpg"
            alt=""
            fetchPriority="high"
          />
          <div className="landing-bg-dots" />
          <div className="landing-bg-fade" />
        </div>

        <div className="landing-shell landing-shell-hero">
          <LandingHeader />

          <main className="landing-hero" aria-label="Introduction">
            <div className="landing-hero-copy">
              <p className="landing-kicker">Los Angeles · ADUs · Garage Conversions</p>
              <h1 className="landing-title">
                Know what the city requires{" "}
                <em>before plan check.</em>
              </h1>
              <p className="landing-lede">
                An AI permitting agent for Los Angeles residential work — OpenAI
                extracts requirements, drafts agency emails, and parses replies,
                with a human at every touchpoint.
              </p>
              <div className="landing-cta">
                <Link className="button button-landing-primary" to={startHref}>
                  Start a project
                </Link>
                <a
                  className="button button-landing-secondary"
                  href="https://github.com/AryanSaxenaa/greenlight"
                  target="_blank"
                  rel="noreferrer"
                >
                  View repository
                </a>
              </div>
            </div>

            <div className="landing-hero-visual">
              <figure className="landing-hero-illustration">
                <img
                  src="/hero-illustration.jpg"
                  alt="Isometric illustration of a Los Angeles residential lot with a main house and backyard ADU"
                  width={960}
                  height={1200}
                  loading="eager"
                  decoding="async"
                />
              </figure>
            </div>
          </main>
        </div>
      </div>

      <div className="landing-shell-content">
        <section className="landing-section landing-section-first" id="product">
          <div className="landing-section-inner">
          <div className="landing-section-grid landing-section-grid-split">
            <div className="landing-section-copy">
              <p className="landing-section-kicker">
                <span className="landing-kicker-line" aria-hidden="true" />
                What Greenlight does
              </p>
              <h2 className="landing-section-title">
                Permitting shouldn&apos;t feel like guessing.
              </h2>
              <p className="landing-section-lede">
                Los Angeles residential permits pull from dozens of sources:
                LADBS bulletins, zoning overlays, fire setbacks, planning
                conditions. Most teams track it in spreadsheets, inboxes, and
                memory.
              </p>
              <p className="landing-section-body">
                Greenlight crawls official sources with Firecrawl, extracts
                structured requirements with OpenAI via Convex AI Gateway, and
                manages the correspondence that keeps your project moving. You
                get clarity on what is required, what is blocked, and what to do
                next, before you submit.
              </p>
            </div>
            <div className="landing-stat-panel" aria-label="Project metrics">
              <div className="landing-stat-row">
                <span className="landing-stat-index">A</span>
                <div className="landing-stat-copy">
                  <span className="landing-stat-value">12+ sources</span>
                  <span className="landing-stat-label">
                    Official LADBS and planning pages crawled per project
                  </span>
                </div>
              </div>
              <div className="landing-stat-row">
                <span className="landing-stat-index">B</span>
                <div className="landing-stat-copy">
                  <span className="landing-stat-value">OpenAI extraction</span>
                  <span className="landing-stat-label">
                    Structured requirements from crawled official sources via Convex AI Gateway
                  </span>
                </div>
              </div>
              <div className="landing-stat-row">
                <span className="landing-stat-index">C</span>
                <div className="landing-stat-copy">
                  <span className="landing-stat-value">Live graph</span>
                  <span className="landing-stat-label">
                    Requirements and blockers update as agency rules change
                  </span>
                </div>
              </div>
              <div className="landing-stat-row">
                <span className="landing-stat-index">D</span>
                <div className="landing-stat-copy">
                  <span className="landing-stat-value">One control room</span>
                  <span className="landing-stat-label">
                    Blockers, documents, AI drafts, and agency correspondence in one place
                  </span>
                </div>
              </div>
            </div>
          </div>
          </div>
        </section>

        <section className="landing-section landing-section-muted landing-section-steps" id="how-it-works">
          <div className="landing-section-inner">
          <div className="landing-section-head landing-section-head-center">
            <p className="landing-section-kicker">
              <span className="landing-kicker-line" aria-hidden="true" />
              How it works
            </p>
            <h2 className="landing-section-title landing-section-title-center">
              From intent to permit-ready in three steps.
            </h2>
            <p className="landing-section-intro">
              Greenlight is built around a simple loop: understand the project,
              compile the rules, and keep you ahead of agency back-and-forth.
            </p>
          </div>
          <div className="landing-steps">
            {STEPS.map((step) => (
              <article key={step.index} className="landing-step-card">
                <span className="landing-step-watermark" aria-hidden="true">
                  {step.index}
                </span>
                <div className="landing-step-icon">
                  <StepIcon type={step.icon} />
                </div>
                <span className="landing-step-index">{step.index}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
          </div>
        </section>

        <section className="landing-section landing-section-features" id="features">
          <div className="landing-section-inner">
          <p className="landing-section-kicker">
            <span className="landing-kicker-line" aria-hidden="true" />
            Platform
          </p>
          <h2 className="landing-section-title">
            Everything you need to stay ahead of plan check.
          </h2>
          <div className="landing-feature-grid">
            {FEATURES.map((feature) => (
              <article
                key={feature.title}
                className={`landing-feature-card landing-feature-${feature.tone}`}
              >
                <div className="landing-feature-icon" aria-hidden="true">
                  <FeatureIcon type={feature.icon} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </article>
            ))}
          </div>
          </div>
        </section>

        <section className="landing-section landing-section-muted landing-section-la" id="built-for">
          <div className="landing-section-inner">
          <div className="landing-section-grid landing-section-grid-split">
            <div className="landing-section-copy">
              <p className="landing-section-kicker">
                <span className="landing-kicker-line" aria-hidden="true" />
                Built for Los Angeles
              </p>
              <h2 className="landing-section-title">
                Starting where permitting is hardest and most valuable.
              </h2>
              <p className="landing-section-body">
                This MVP focuses on Los Angeles city residential work: ADUs, garage
                conversions, and small additions. Greenlight resolves your
                jurisdiction, crawls the sources that matter for your parcel, and
                builds a project-specific path, not a generic checklist.
              </p>
              <ul className="landing-checklist">
                <li>ADU and garage conversion intents</li>
                <li>Firecrawl source crawling + OpenAI requirement extraction</li>
                <li>OpenAI-drafted agency emails with approval before send</li>
                <li>Real-time control room for your permit graph</li>
              </ul>
            </div>
            <div className="landing-quote-card">
              <span className="landing-quote-mark" aria-hidden="true">&ldquo;</span>
              <p className="landing-quote">
                The goal isn&apos;t to replace your architect or expeditor.
                It&apos;s to give them a live map of what the city actually
                requires.
              </p>
              <p className="landing-quote-meta">Greenlight product principle</p>
            </div>
          </div>
          </div>
        </section>

        <section className="landing-section landing-section-trust" id="security">
          <div className="landing-section-inner">
          <div className="landing-section-head">
            <p className="landing-section-kicker">
              <span className="landing-kicker-line" aria-hidden="true" />
              Trust &amp; control
            </p>
            <h2 className="landing-section-title">You approve what leaves your desk.</h2>
            <p className="landing-section-body">
              Greenlight never sends agency correspondence without your sign-off.
              Your project data stays scoped, auditable, and under your control.
            </p>
          </div>
          <div className="landing-trust-grid">
            {TRUST_POINTS.map((point) => (
              <article key={point.title} className="landing-trust-card">
                <h3>{point.title}</h3>
                <p>{point.body}</p>
              </article>
            ))}
          </div>
          </div>
        </section>

        <section className="landing-cta-band">
          <div className="landing-section-inner">
          <div className="landing-cta-band-inner">
            <h2 className="landing-cta-title">
              Ready to see your path to approval?
            </h2>
            <p className="landing-cta-copy">
              Create a project in minutes. Firecrawl and OpenAI compile your permit
              graph and open your control room automatically.
            </p>
            <div className="landing-cta">
              <Link className="button button-landing-primary" to={startHref}>
                Start a project
              </Link>
              <Link className="button button-landing-secondary" to="/auth">
                Create account
              </Link>
            </div>
          </div>
          </div>
        </section>

        <LandingFooter signedIn={signedIn} />
      </div>
    </div>
  );
}
