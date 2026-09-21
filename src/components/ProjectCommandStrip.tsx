import type { ReactNode } from "react";

type ProjectCommandStripProps = {
  title: string;
  address: string;
  readinessPercent: number;
  readinessHint: string;
  verifiedCount: number;
  eligibleCount: number;
  nextAction?: string;
  compiling?: boolean;
  metrics: Array<{ value: number; label: string }>;
  details: Array<{ label: string; value: string }>;
  onShowActivity?: () => void;
  pendingApprovals?: number;
  actions?: ReactNode;
};

export function ProjectCommandStrip({
  title,
  address,
  readinessPercent,
  readinessHint,
  verifiedCount,
  eligibleCount,
  nextAction,
  compiling,
  metrics,
  details,
  onShowActivity,
  pendingApprovals = 0,
  actions,
}: ProjectCommandStripProps) {
  return (
    <header className="project-command-strip">
      <div className="project-command-primary">
        <div className="project-command-titleblock">
          <p className="project-command-eyebrow">Active project</p>
          <h1 className="project-command-title">{title}</h1>
          <p className="project-command-address">{address}</p>
        </div>

        <div className="project-readiness-inline" aria-label={`${readinessPercent}% permit ready`}>
          <div className="project-readiness-inline-head">
            <strong>{readinessPercent}%</strong>
            <span>Permit ready</span>
          </div>
          <div className="project-readiness-inline-bar" aria-hidden="true">
            <i style={{ width: `${readinessPercent}%` }} />
          </div>
          <p className="project-readiness-inline-meta">
            {verifiedCount}/{eligibleCount} verified · {readinessHint}
          </p>
        </div>

        <div className="project-command-actions">
          {actions}
          {pendingApprovals > 0 && onShowActivity ? (
            <button className="project-alert-chip" type="button" onClick={onShowActivity}>
              {pendingApprovals} pending approval{pendingApprovals === 1 ? "" : "s"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="project-command-secondary">
        {compiling ? (
          <div className="dash-compiling-pill dash-compiling-pill-inline">
            <span className="dash-compiling-dot" aria-hidden="true" />
            Compiling live
          </div>
        ) : null}

        <div className="project-metric-chips" aria-label="Compiler metrics">
          {metrics.map((metric) => (
            <span className="project-metric-chip" key={metric.label}>
              <strong>{metric.value}</strong> {metric.label}
            </span>
          ))}
        </div>

        <DashDisclosureInline details={details} />
      </div>

      <div className="project-next-action-bar">
        <span className="project-next-action-label">Next action</span>
        <p>{nextAction ?? "Waiting for compiler output."}</p>
      </div>
    </header>
  );
}

function DashDisclosureInline({ details }: { details: Array<{ label: string; value: string }> }) {
  if (!details.length) {
    return null;
  }

  return (
    <details className="dash-disclosure dash-disclosure-inline">
      <summary>Project details</summary>
      <dl className="project-details-grid">
        {details.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

export function ProjectWorkspaceTabs({
  active,
  onChange,
  tabs,
}: {
  active: string;
  onChange: (id: string) => void;
  tabs: Array<{ id: string; label: string; badge?: number }>;
}) {
  return (
    <div className="project-workspace-tabs" role="tablist" aria-label="Project workspace">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={active === tab.id ? "project-workspace-tab is-active" : "project-workspace-tab"}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          {tab.badge && tab.badge > 0 ? (
            <span className="project-workspace-tab-badge">{tab.badge}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
