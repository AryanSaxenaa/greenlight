import { useMemo, useState } from "react";
import type { RequirementStatus } from "../lib/status";
import { statusLabel } from "../lib/status";

export type PermitGraphNode = {
  nodeKey: string;
  title: string;
  status: RequirementStatus;
  isPrimaryBlocker: boolean;
  sourceLabel?: string;
  blockedReason?: string;
};

type ProjectPermitGraphProps = {
  nodes: PermitGraphNode[];
  loading?: boolean;
  readinessPercent: number;
  variant?: "royal" | "light";
  compact?: boolean;
};

const STATUS_VARIANT: Record<RequirementStatus, string> = {
  verified: "cr-pill-verified",
  blocked: "cr-pill-blocked",
  review: "cr-pill-review",
  missing: "cr-pill-missing",
  locked: "cr-pill-locked",
};

const LIGHT_STATUS_VARIANT: Record<RequirementStatus, string> = {
  verified: "dash-pill-verified",
  blocked: "dash-pill-blocked",
  review: "dash-pill-review",
  missing: "dash-pill-missing",
  locked: "dash-pill-locked",
};

export function ProjectPermitGraph({
  nodes,
  loading,
  readinessPercent,
  variant = "light",
  compact = false,
}: ProjectPermitGraphProps) {
  const [expanded, setExpanded] = useState(true);
  const sorted = [...nodes].sort((left, right) => {
    const order = [
      "property",
      "zoning",
      "setback",
      "height",
      "parking",
      "site_plan",
      "structural",
      "permit",
      "plan_check",
    ];
    return order.indexOf(left.nodeKey) - order.indexOf(right.nodeKey);
  });

  const openCount = sorted.filter((node) => node.status !== "locked").length;
  const verifiedCount = sorted.filter((node) => node.status === "verified").length;
  const blocker =
    sorted.find((node) => node.isPrimaryBlocker) ??
    sorted.find((node) => node.status === "blocked");

  const priorityNodes = useMemo(() => {
    const actionable = sorted.filter(
      (node) =>
        node.isPrimaryBlocker ||
        node.status === "blocked" ||
        node.status === "missing" ||
        node.status === "review",
    );
    const unique = new Map(actionable.map((node) => [node.nodeKey, node]));
    if (blocker) {
      unique.set(blocker.nodeKey, blocker);
    }
    return [...unique.values()].slice(0, 5);
  }, [sorted, blocker]);

  const hiddenCount = Math.max(sorted.length - priorityNodes.length, 0);
  const visibleNodes = compact && !expanded ? priorityNodes : sorted;

  const statusVariant = variant === "light" ? LIGHT_STATUS_VARIANT : STATUS_VARIANT;
  const shellClass = variant === "light" ? "dash-graph" : "cr-graph-glass";
  const headClass = variant === "light" ? "dash-graph-head" : "cr-graph-glass-head";
  const kickerClass = variant === "light" ? "dash-graph-kicker" : "cr-graph-glass-kicker";
  const metaClass = variant === "light" ? "dash-graph-meta" : "cr-graph-glass-meta";
  const scoreClass = variant === "light" ? "dash-graph-score" : "cr-graph-glass-score";
  const listClass = variant === "light" ? "dash-graph-list" : "cr-graph-glass-list";
  const rowClass = variant === "light" ? "dash-graph-row" : "cr-graph-glass-row";
  const rowMainClass = variant === "light" ? "dash-graph-row-main" : "cr-graph-glass-row-main";
  const indexClass = variant === "light" ? "dash-graph-index" : "cr-graph-glass-index";
  const sourceClass = variant === "light" ? "dash-graph-source" : "cr-graph-glass-source";
  const alertClass = variant === "light" ? "dash-graph-alert" : "cr-graph-glass-alert";
  const alertLabelClass = variant === "light" ? "dash-graph-alert-label" : "cr-graph-glass-alert-label";
  const calmAlertClass =
    variant === "light" ? "dash-graph-alert dash-graph-alert-calm" : "cr-graph-glass-alert cr-graph-glass-alert-calm";

  if (loading) {
    return (
      <div className={`${shellClass} ${shellClass}-loading`}>
        {variant === "royal" ? <div className="cr-graph-shimmer" aria-hidden="true" /> : null}
        <p>Compiling your permit graph…</p>
      </div>
    );
  }

  if (!sorted.length) {
    return (
      <div className={`${shellClass} ${shellClass}-empty`}>
        {variant === "royal" ? (
          <div className="cr-graph-orbit" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        ) : null}
        <p>Waiting for compiler to map requirements.</p>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <header className={headClass}>
        <div>
          <span className={kickerClass}>Permit graph</span>
          <p className={metaClass}>
            {verifiedCount} of {openCount} open steps verified · live sync
          </p>
        </div>
        <div className={scoreClass}>{readinessPercent}% ready</div>
      </header>

      {variant === "royal" || variant === "light" ? (
        <div
          className={
            variant === "light" ? "dash-graph-flow" : "cr-graph-glass-flow"
          }
          aria-hidden="true"
        >
          {sorted.map((node, index) => (
            <span
              key={`dot-${node.nodeKey}`}
              className={`${
                variant === "light" ? "dash-graph-flow-node" : "cr-graph-flow-node"
              } ${variant === "light" ? `dash-graph-flow-${node.status}` : `cr-graph-flow-${node.status}`}`}
              style={{ left: `${8 + index * (84 / Math.max(sorted.length - 1, 1))}%` }}
            />
          ))}
          <svg
            className={variant === "light" ? "dash-graph-flow-line" : "cr-graph-flow-line"}
            viewBox="0 0 400 24"
            preserveAspectRatio="none"
          >
            <path
              d="M8 12 C120 4, 280 20, 392 12"
              fill="none"
              stroke={variant === "light" ? "url(#dashGreenLine)" : "url(#crGoldLine)"}
              strokeWidth="2"
            />
            <defs>
              {variant === "light" ? (
                <linearGradient id="dashGreenLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgba(31, 107, 82, 0.15)" />
                  <stop offset="50%" stopColor="rgba(31, 107, 82, 0.75)" />
                  <stop offset="100%" stopColor="rgba(31, 107, 82, 0.35)" />
                </linearGradient>
              ) : (
                <linearGradient id="crGoldLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgba(201,169,98,0.2)" />
                  <stop offset="50%" stopColor="rgba(201,169,98,0.85)" />
                  <stop offset="100%" stopColor="rgba(31,107,82,0.6)" />
                </linearGradient>
              )}
            </defs>
          </svg>
        </div>
      ) : null}

      <ul className={listClass}>
        {visibleNodes.map((node) => {
          const index = Math.max(
            0,
            sorted.findIndex((item) => item.nodeKey === node.nodeKey),
          );
          return (
          <li className={rowClass} key={node.nodeKey}>
            <div className={rowMainClass}>
              <span className={indexClass}>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{node.title}</strong>
                {node.sourceLabel ? (
                  <span className={sourceClass}>{node.sourceLabel}</span>
                ) : null}
              </div>
            </div>
            <span className={`cr-status-pill ${statusVariant[node.status]}`}>
              {statusLabel(node.status)}
            </span>
          </li>
          );
        })}
      </ul>

      {compact && hiddenCount > 0 ? (
        <button
          className="dash-graph-expand"
          type="button"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Show priority steps only" : `Show all ${sorted.length} steps (${hiddenCount} hidden)`}
        </button>
      ) : null}

      {blocker ? (
        <div className={alertClass}>
          <span className={alertLabelClass}>Primary focus</span>
          <strong>{blocker.title}</strong>
          {blocker.blockedReason ? (
            <p className="dash-graph-blocker-reason">{blocker.blockedReason}</p>
          ) : null}
          {blocker.status === "blocked" ? (
            <p className="dash-graph-blocker-hint muted">
              Upload a revised site plan showing rear setback, or approve an agency clarification
              draft in Activity to clear this step.
            </p>
          ) : null}
        </div>
      ) : (
        <div className={calmAlertClass}>
          <span className={alertLabelClass}>Status</span>
          <strong>No blockers — upload evidence to raise readiness</strong>
        </div>
      )}
    </div>
  );
}
