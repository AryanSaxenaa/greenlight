type ControlRoomHeroProps = {
  title: string;
  intent: string;
  address?: string;
  jurisdiction: string;
  parcelId: string;
  zoning: string;
  inboxEmail?: string;
  readinessPercent: number;
  readinessHint: string;
  verifiedCount: number;
  eligibleCount: number;
  sourcesDiscovered: number;
  sourcesRetrieved: number;
  rulesExtracted: number;
  blockerCount: number;
  variant?: "royal" | "light";
};

export function ControlRoomHero({
  title,
  intent,
  address,
  jurisdiction,
  parcelId,
  zoning,
  inboxEmail,
  readinessPercent,
  readinessHint,
  verifiedCount,
  eligibleCount,
  sourcesDiscovered,
  sourcesRetrieved,
  rulesExtracted,
  blockerCount,
  variant = "light",
}: ControlRoomHeroProps) {
  const ringOffset = 283 - (283 * readinessPercent) / 100;

  if (variant === "light") {
    return (
      <section className="dash-hero">
        <div className="dash-hero-main">
          <div className="dash-hero-copy">
            <span className="dash-hero-eyebrow">Los Angeles permit control room</span>
            <p className="dash-hero-intent">{intent}</p>
            <dl className="dash-hero-facts">
              <div>
                <dt>Project</dt>
                <dd>{title}</dd>
              </div>
              {address ? (
                <div className="dash-hero-facts-wide">
                  <dt>Address</dt>
                  <dd>{address}</dd>
                </div>
              ) : null}
              <div>
                <dt>Jurisdiction</dt>
                <dd>{jurisdiction}</dd>
              </div>
              <div>
                <dt>Parcel</dt>
                <dd>{parcelId}</dd>
              </div>
              <div>
                <dt>Zoning</dt>
                <dd>{zoning}</dd>
              </div>
              {inboxEmail ? (
                <div className="dash-hero-facts-wide">
                  <dt>Project inbox</dt>
                  <dd>{inboxEmail}</dd>
                </div>
              ) : null}
            </dl>
          </div>

          <div className="dash-readiness">
            <div className="dash-readiness-ring-wrap">
              <svg className="dash-readiness-ring" viewBox="0 0 100 100" aria-hidden="true">
                <circle className="dash-readiness-ring-track" cx="50" cy="50" r="42" />
                <circle
                  className="dash-readiness-ring-fill"
                  cx="50"
                  cy="50"
                  r="42"
                  style={{ strokeDashoffset: ringOffset }}
                />
              </svg>
              <div className="dash-readiness-center">
                <strong>{readinessPercent}%</strong>
                <span>Permit ready</span>
              </div>
            </div>
            <p>{readinessHint}</p>
            <p className="muted">
              {verifiedCount} of {eligibleCount} open requirements verified
            </p>
          </div>
        </div>

        <div className="dash-metric-strip">
          {[
            { value: sourcesDiscovered, label: "Sources discovered" },
            { value: sourcesRetrieved, label: "Sources retrieved" },
            { value: rulesExtracted, label: "Rules extracted" },
            { value: blockerCount, label: "Blockers" },
          ].map((metric) => (
            <div className="dash-metric-tile" key={metric.label}>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="cr-hero-crown">
      <div className="cr-hero-crown-bg" aria-hidden="true">
        <img src="/hero-background.jpg" alt="" className="cr-hero-crown-photo" />
        <div className="cr-hero-crown-mesh" />
        <div className="cr-hero-crown-grid" />
      </div>

      <div className="cr-hero-crown-inner">
        <div className="cr-hero-copy">
          <span className="cr-eyebrow">
            <span className="cr-eyebrow-dot" aria-hidden="true" />
            Los Angeles permit control room
          </span>
          <h1 className="cr-hero-title">{title}</h1>
          <p className="cr-hero-intent">{intent}</p>
          <dl className="cr-hero-facts">
            <div>
              <dt>Jurisdiction</dt>
              <dd>{jurisdiction}</dd>
            </div>
            <div>
              <dt>Parcel</dt>
              <dd>{parcelId}</dd>
            </div>
            <div>
              <dt>Zoning</dt>
              <dd>{zoning}</dd>
            </div>
            {inboxEmail ? (
              <div className="cr-hero-facts-wide">
                <dt>Project inbox</dt>
                <dd>{inboxEmail}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="cr-readiness-orb">
          <div className="cr-readiness-orb-shell">
            <div className="cr-readiness-orb-core">
              <svg className="cr-readiness-ring" viewBox="0 0 100 100" aria-hidden="true">
                <defs>
                  <linearGradient id="crGoldRing" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#1f6b52" />
                    <stop offset="100%" stopColor="#c9a962" />
                  </linearGradient>
                </defs>
                <circle className="cr-readiness-ring-track" cx="50" cy="50" r="45" />
                <circle
                  className="cr-readiness-ring-fill"
                  cx="50"
                  cy="50"
                  r="45"
                  style={{ strokeDashoffset: ringOffset }}
                />
              </svg>
              <div className="cr-readiness-orb-center">
                <span className="cr-readiness-orb-value">{readinessPercent}%</span>
                <span className="cr-readiness-orb-label">Permit ready</span>
              </div>
            </div>
          </div>
          <p className="cr-readiness-orb-hint">{readinessHint}</p>
          <p className="cr-readiness-orb-sub">
            {verifiedCount} of {eligibleCount} open requirements verified
          </p>
        </div>
      </div>

      <div className="cr-metric-strip">
        {[
          { value: sourcesDiscovered, label: "Sources discovered" },
          { value: sourcesRetrieved, label: "Sources retrieved" },
          { value: rulesExtracted, label: "Rules extracted" },
          { value: blockerCount, label: "Blockers" },
        ].map((metric) => (
          <div className="cr-metric-tile" key={metric.label}>
            <span className="cr-metric-value">{metric.value}</span>
            <span className="cr-metric-label">{metric.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
