function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <circle cx="7" cy="7" r="6.5" fill="#e8f3ea" stroke="#3d8b52" strokeWidth="1" />
      <path
        d="M4.5 7.2L6.3 9l3.2-3.4"
        fill="none"
        stroke="#3d8b52"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <circle cx="7" cy="7" r="6.5" fill="#f4f7f4" stroke="#6e7c68" strokeWidth="1" />
      <path
        d="M7 4.5V7l2 1.2"
        fill="none"
        stroke="#6e7c68"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <rect x="3.5" y="2" width="7" height="10" rx="0.5" fill="none" stroke="#6e7c68" strokeWidth="1" />
      <line x1="5" y1="5" x2="9" y2="5" stroke="#6e7c68" strokeWidth="0.8" />
      <line x1="5" y1="7" x2="9" y2="7" stroke="#6e7c68" strokeWidth="0.8" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path
        d="M7 1.5L11.5 3.5V7c0 2.5-1.8 4.2-4.5 5.5C4.3 11.2 2.5 9.5 2.5 7V3.5L7 1.5z"
        fill="none"
        stroke="#6e7c68"
        strokeWidth="1"
      />
    </svg>
  );
}

function WarnIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path
        d="M7 2L12.5 11.5H1.5L7 2z"
        fill="#fef6e8"
        stroke="#c9923f"
        strokeWidth="1"
      />
      <line x1="7" y1="5.5" x2="7" y2="8.5" stroke="#c9923f" strokeWidth="1.2" />
      <circle cx="7" cy="10" r="0.6" fill="#c9923f" />
    </svg>
  );
}

const STEPS = [
  { label: "Zoning & Land Use", icon: <DocIcon />, status: "done" as const },
  { label: "Building & Safety", icon: <DocIcon />, status: "done" as const },
  { label: "Fire Department", icon: <ShieldIcon />, status: "done" as const },
  { label: "Planning Review", icon: <ClockIcon />, status: "active" as const },
];

export function PermitGraphCard() {
  return (
    <div className="permit-graph-card">
      <div className="permit-graph-header">
        <div className="permit-graph-title">
          <span className="permit-graph-dot" aria-hidden="true" />
          Permit Graph
        </div>
        <div className="permit-graph-live">
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path
              d="M6 1v2M6 9v2M1 6h2M9 6h2M2.8 2.8l1.4 1.4M7.8 7.8l1.4 1.4M2.8 9.2l1.4-1.4M7.8 4.2l1.4-1.4"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </svg>
          Live updates
        </div>
      </div>

      <div className="permit-graph-body">
        <div className="permit-graph-steps">
          {STEPS.map((step, index) => (
            <div key={step.label} className="permit-step">
              {index > 0 ? <div className="permit-step-line" aria-hidden="true" /> : null}
              <div className="permit-step-row">
                <span className="permit-step-icon">{step.icon}</span>
                <div className="permit-step-copy">
                  <span className="permit-step-label">{step.label}</span>
                  {step.status === "active" ? (
                    <span className="permit-step-active">In progress...</span>
                  ) : null}
                </div>
                {step.status === "done" ? <CheckIcon /> : null}
              </div>
            </div>
          ))}
        </div>

        <div className="permit-graph-panels">
          <div className="permit-panel permit-panel-success">
            <CheckIcon />
            <div>
              <strong>Requirements found</strong>
              <span>12 official sources analyzed</span>
            </div>
          </div>

          <div className="permit-panel">
            <DocIcon />
            <div>
              <strong>Agency correspondence</strong>
              <span>Drafted for your approval</span>
            </div>
            <svg className="permit-panel-chevron" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
              <path d="M3 2l4 3-4 3" fill="none" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </div>

          <div className="permit-panel permit-panel-warn">
            <WarnIcon />
            <div>
              <strong>Blockers detected</strong>
              <span>1 item requires action</span>
            </div>
            <svg className="permit-panel-chevron" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
              <path d="M3 2l4 3-4 3" fill="none" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </div>

          <div className="permit-map">
            <div className="permit-map-grid" aria-hidden="true">
              {Array.from({ length: 36 }).map((_, i) => (
                <span key={i} />
              ))}
            </div>
            <svg className="permit-map-line" viewBox="0 0 120 60" preserveAspectRatio="none" aria-hidden="true">
              <path
                d="M8 48 C28 42, 42 28, 58 32 S88 18, 112 12"
                fill="none"
                stroke="#3d8b52"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="112" cy="12" r="4" fill="#3d8b52" />
            </svg>
            <span className="permit-map-label">Los Angeles, CA</span>
          </div>
        </div>
      </div>
    </div>
  );
}
