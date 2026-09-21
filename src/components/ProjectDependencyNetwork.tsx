import type { RequirementStatus } from "../lib/status";
import { statusLabel } from "../lib/status";

export type DependencyNode = {
  nodeKey: string;
  title: string;
  status: RequirementStatus;
  isPrimaryBlocker: boolean;
};

export type DependencyEdge = {
  fromNodeKey: string;
  toNodeKey: string;
  relationship: string;
};

type ProjectDependencyNetworkProps = {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  loading?: boolean;
};

const NODE_LAYOUT: Record<string, { x: number; y: number }> = {
  property: { x: 14, y: 22 },
  zoning: { x: 14, y: 48 },
  setback: { x: 38, y: 16 },
  height: { x: 52, y: 42 },
  parking: { x: 38, y: 68 },
  site_plan: { x: 62, y: 58 },
  permit: { x: 78, y: 32 },
  structural: { x: 78, y: 58 },
  plan_check: { x: 90, y: 82 },
};

const STATUS_CLASS: Record<RequirementStatus, string> = {
  verified: "dash-network-node-verified",
  blocked: "dash-network-node-blocked",
  review: "dash-network-node-review",
  missing: "dash-network-node-missing",
  locked: "dash-network-node-locked",
};

function nodeCenter(nodeKey: string) {
  return NODE_LAYOUT[nodeKey] ?? { x: 50, y: 50 };
}

export function ProjectDependencyNetwork({
  nodes,
  edges,
  loading,
}: ProjectDependencyNetworkProps) {
  if (loading) {
    return (
      <div className="dash-network dash-network-loading">
        <p>Loading dependency network…</p>
      </div>
    );
  }

  if (!nodes.length) {
    return (
      <div className="dash-network dash-network-empty">
        <p>Dependency graph will appear after compilation.</p>
      </div>
    );
  }

  const visibleNodes = nodes.filter((node) => NODE_LAYOUT[node.nodeKey]);
  const visibleEdges = edges.filter(
    (edge) => NODE_LAYOUT[edge.fromNodeKey] && NODE_LAYOUT[edge.toNodeKey],
  );

  return (
    <div className="dash-network">
      <header className="dash-network-head">
        <div>
          <span className="dash-network-kicker">Dependency network</span>
          <p className="dash-network-meta">
            {visibleEdges.length} dependencies · arrows show what must clear first
          </p>
        </div>
      </header>

      <div className="dash-network-canvas-wrap">
        <svg
          className="dash-network-lines"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <marker
              id="dash-network-arrow"
              markerWidth="6"
              markerHeight="6"
              refX="5"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L6,3 L0,6 Z" fill="rgba(31, 107, 82, 0.55)" />
            </marker>
          </defs>
          {visibleEdges.map((edge) => {
            const from = nodeCenter(edge.fromNodeKey);
            const to = nodeCenter(edge.toNodeKey);
            return (
              <line
                key={`${edge.fromNodeKey}-${edge.toNodeKey}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                className="dash-network-line"
                markerEnd="url(#dash-network-arrow)"
              />
            );
          })}
        </svg>

        <div className="dash-network-nodes">
          {visibleNodes.map((node) => {
            const position = nodeCenter(node.nodeKey);
            return (
              <div
                key={node.nodeKey}
                className={`dash-network-node ${STATUS_CLASS[node.status]} ${
                  node.isPrimaryBlocker ? "dash-network-node-primary" : ""
                }`}
                style={{ left: `${position.x}%`, top: `${position.y}%` }}
                title={node.title}
              >
                <span className="dash-network-node-label">{shortLabel(node.title)}</span>
                <span className="dash-network-node-status">{statusLabel(node.status)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function shortLabel(title: string): string {
  if (title.length <= 18) {
    return title;
  }
  return `${title.slice(0, 16)}…`;
}
