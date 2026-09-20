import { useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { LandingFooter } from "../components/LandingFooter";
import { LandingHeader } from "../components/LandingHeader";
import { PageMeta } from "../components/PageMeta";

const SPONSORS = [
  {
    name: "Convex",
    href: "https://convex.dev",
    role:
      "Realtime database, compiler pipeline, auth, file storage, HTTP webhooks, and AI Gateway orchestration.",
  },
  {
    name: "OpenAI",
    href: "https://openai.com",
    role:
      "Requirement extraction, email parsing, clarification drafts, and document facts via Convex AI Gateway (`gpt-4o-mini`).",
  },
  {
    name: "Firecrawl",
    href: "https://firecrawl.dev",
    role:
      "Crawls and monitors official LADBS and City Planning sources; webhook-driven re-evaluation when pages change.",
  },
  {
    name: "AgentMail",
    href: "https://agentmail.to",
    role:
      "Project inboxes, outbound send after your approval, and Svix-verified inbound agency reply webhooks.",
  },
];

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
      "Firecrawl crawls official LADBS and City Planning sources. OpenAI via Convex AI Gateway extracts structured requirements into a live dependency graph stored on Convex.",
    icon: "graph",
  },
  {
    index: "03",
    title: "Stay permit-ready",
    body:
      "Track blockers, upload evidence, and approve OpenAI-drafted clarifications sent through AgentMail. Replies sync back to your realtime control room.",
    icon: "ready",
  },
];

const FEATURES = [
  {
    title: "Live permit graph",
    body:
      "Convex powers a realtime control room where requirements, dependencies, and blockers update without refresh.",
    tone: "forest",
    icon: "graph",
  },
  {
    title: "Official source research",
    body:
      "Firecrawl pulls from LADBS, zoning bulletins, and planning pages so your checklist reflects what agencies actually publish.",
    tone: "sage",
    icon: "sources",
  },
  {
    title: "AI extraction & drafts",
    body:
      "OpenAI via Convex AI Gateway turns crawled sources into structured requirements, parses agency replies, and drafts clarifications for your review.",
    tone: "ink",
    icon: "approve",
  },
  {
    title: "Agency correspondence",
    body:
      "AgentMail provisions project inboxes, sends approved outbound mail, and ingests inbound replies through verified webhooks.",
    tone: "ochre",
    icon: "mail",
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
    body: "Every compiler run, source crawl, and status change is logged.",
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
      <PageMeta
        title="Know what the city requires"
        description="AI permitting agent for Los Angeles residential work — ADUs, garage conversions, and small additions."
        path="/"
      />
      <div className="landing-hero-wrap">
        <div className="landing-bg" aria-hidden="true">
          <img
            className="landing-bg-image"
            src="/hero-background.jpg"
            alt=""
            width={1920}
            height={1080}
            decoding="async"
            fetchPriority="high"
          />
          <div className="landing-bg-dots" />
          <div className="landing-bg-fade" />
        </div>

        <div className="landing-shell landing-shell-hero">
          <LandingHeader />

          <main className="landing-hero" aria-label="Introduction">
            <div className="landing-hero-copy">
              <p className="landing-kicker">
                Los Angeles · ADUs ·{" "}
                <a
                  className="landing-kicker-link"
                  href="https://www.convex.dev/hackathons/all-gas"
                  target="_blank"
                  rel="noreferrer"
                >
                  Convex All Gas Hackathon
                </a>
              </p>
              <h1 className="landing-title">
                Know what the city requires{" "}
                <em>before plan check.</em>
              </h1>
              <p className="landing-lede">
                An AI permitting agent for Los Angeles residential work, with a
                human at every agency touchpoint.
              </p>
              <div className="landing-cta landing-cta-single">
                <Link className="button button-landing-primary" to={startHref}>
                  Start a project
                </Link>
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
                Greenlight researches official sources, compiles requirements into
                a live permit graph, and manages the correspondence that keeps
                your project moving. You get clarity on what is required, what is
                blocked, and what to do next, before you submit.
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
                  <span className="landing-stat-value">Live graph</span>
                  <span className="landing-stat-label">
                    Requirements and blockers update as agency rules change
                  </span>
                </div>
              </div>
              <div className="landing-stat-row">
                <span className="landing-stat-index">C</span>
                <div className="landing-stat-copy">
                  <span className="landing-stat-value">One control room</span>
                  <span className="landing-stat-label">
                    Blockers, documents, and agency correspondence in one place
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

        <section
          className="landing-section landing-section-muted landing-section-sponsors"
          id="stack"
        >
          <div className="landing-section-inner">
            <div className="landing-section-head landing-section-head-center">
              <p className="landing-section-kicker">
                <span className="landing-kicker-line" aria-hidden="true" />
                All Gas stack
              </p>
              <h2 className="landing-section-title landing-section-title-center">
                Built with Convex, OpenAI, Firecrawl, and AgentMail.
              </h2>
              <p className="landing-section-intro">
                Greenlight is an entry for the{" "}
                <a
                  href="https://www.convex.dev/hackathons/all-gas"
                  target="_blank"
                  rel="noreferrer"
                >
                  Convex All Gas Hackathon
                </a>
                . Each sponsor powers a distinct part of the permitting workflow.
              </p>
            </div>
            <div className="landing-sponsor-grid">
              {SPONSORS.map((sponsor) => (
                <article key={sponsor.name} className="landing-sponsor-card">
                  <a
                    className="landing-sponsor-name"
                    href={sponsor.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {sponsor.name}
                  </a>
                  <p>{sponsor.role}</p>
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
                <li>AgentMail inbox with approval before send</li>
                <li>Convex realtime control room for your permit graph</li>
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
              Create a project in minutes. Greenlight compiles your permit graph and
              opens your control room automatically.
            </p>
            <div className="landing-cta landing-cta-single">
              <Link className="button button-landing-primary" to={startHref}>
                Start a project
              </Link>
            </div>
          </div>
          </div>
        </section>

        <LandingFooter />
      </div>
    </div>
  );
}
