export function HeroSchematic() {
  return (
    <svg
      className="hero-schematic"
      viewBox="0 0 360 300"
      width="100%"
      height="auto"
      aria-hidden="true"
      role="img"
    >
      <title>ADU floor plan schematic</title>
      <rect
        x="24"
        y="24"
        width="312"
        height="220"
        fill="none"
        stroke="var(--line)"
        strokeWidth="1.4"
      />
      <line x1="24" y1="134" x2="196" y2="134" stroke="var(--line)" strokeWidth="1.2" />
      <line x1="196" y1="24" x2="196" y2="244" stroke="var(--line)" strokeWidth="1.2" />
      <rect
        x="210"
        y="148"
        width="110"
        height="72"
        fill="none"
        stroke="var(--line)"
        strokeWidth="1"
        strokeDasharray="4 3"
      />
      <path
        d="M196 134 A44 44 0 0 1 240 178"
        fill="none"
        stroke="var(--line)"
        strokeWidth="1"
      />
      <line x1="24" y1="262" x2="336" y2="262" stroke="var(--sage)" strokeWidth="1" />
      <line x1="24" y1="258" x2="24" y2="266" stroke="var(--sage)" strokeWidth="1" />
      <line x1="336" y1="258" x2="336" y2="266" stroke="var(--sage)" strokeWidth="1" />
      <text
        x="150"
        y="280"
        fontFamily="var(--font-mono)"
        fontSize="9"
        fill="var(--sage)"
      >
        24&apos;-0&quot; REAR SETBACK
      </text>
      <circle cx="252" cy="78" r="3" fill="var(--ochre)" />
      <line
        x1="252"
        y1="78"
        x2="298"
        y2="48"
        stroke="var(--ochre)"
        strokeWidth="0.8"
        strokeDasharray="2 2"
      />
      <text
        x="268"
        y="42"
        fontFamily="var(--font-mono)"
        fontSize="8"
        fill="var(--ochre)"
      >
        HEIGHT LIMIT
      </text>
      <text
        x="36"
        y="48"
        fontFamily="var(--font-mono)"
        fontSize="8"
        fill="var(--sage)"
      >
        EXISTING GARAGE
      </text>
      <text
        x="210"
        y="188"
        fontFamily="var(--font-mono)"
        fontSize="8"
        fill="var(--sage)"
      >
        PROPOSED ADU
      </text>
      <line x1="36" y1="56" x2="180" y2="56" stroke="var(--sage)" strokeWidth="0.6" />
      <line x1="36" y1="52" x2="36" y2="60" stroke="var(--sage)" strokeWidth="0.6" />
      <line x1="180" y1="52" x2="180" y2="60" stroke="var(--sage)" strokeWidth="0.6" />
      <text x="96" y="70" fontFamily="var(--font-mono)" fontSize="7.5" fill="var(--sage)">
        20&apos;-0&quot;
      </text>
    </svg>
  );
}
