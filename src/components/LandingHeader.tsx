import { Link } from "react-router-dom";

type LandingHeaderProps = {
  signedIn: boolean;
};

const NAV_LINKS = [
  { label: "Product", href: "#product" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Built for LA", href: "#built-for" },
  { label: "Security", href: "#security" },
  { label: "Docs", href: "https://github.com/AryanSaxenaa/greenlight", external: true },
];

export function LandingHeader({ signedIn }: LandingHeaderProps) {
  return (
    <header className="landing-header">
      <div className="landing-header-inner">
        <Link className="landing-brand" to="/">
          <svg
            className="landing-brand-mark"
            width="18"
            height="18"
            viewBox="0 0 14 14"
            aria-hidden="true"
          >
            <path
              d="M7 0L14 7L7 14L0 7Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          </svg>
          <span>Greenlight</span>
        </Link>

        <nav className="landing-nav" aria-label="Main">
          {NAV_LINKS.map((item) =>
            item.external ? (
              <a
                key={item.label}
                className="landing-nav-link"
                href={item.href}
                target="_blank"
                rel="noreferrer"
              >
                {item.label}
              </a>
            ) : (
              <a key={item.label} className="landing-nav-link" href={item.href}>
                {item.label}
              </a>
            ),
          )}
        </nav>

        <div className="landing-header-actions">
          <Link
            className="landing-login"
            to={signedIn ? "/projects/new" : "/auth"}
          >
            {signedIn ? "Dashboard" : "Log In"}
          </Link>
          <Link
            className="button button-landing-primary"
            to={signedIn ? "/projects/new" : "/auth"}
          >
            Book A Demo
          </Link>
        </div>
      </div>
    </header>
  );
}
