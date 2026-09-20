import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";

const NAV_LINKS = [
  { label: "Product", href: "#product" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Built for LA", href: "#built-for" },
  { label: "Security", href: "#security" },
  { label: "Docs", href: "https://github.com/AryanSaxenaa/greenlight", external: true },
];

export function LandingHeader() {
  const viewer = useQuery(api.users.viewer);
  const { signOut } = useAuthActions();
  const signedIn = Boolean(viewer);

  async function handleSignOut() {
    await signOut();
    window.location.assign("/");
  }

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
          {signedIn ? (
            <>
              <Link className="landing-login" to="/projects">
                Dashboard
              </Link>
              <button
                className="landing-login landing-sign-out"
                type="button"
                onClick={() => void handleSignOut()}
              >
                Sign out
              </button>
              <Link
                className="button button-landing-primary"
                to="/projects/new"
              >
                New project
              </Link>
            </>
          ) : (
            <>
              <Link className="landing-login" to="/auth">
                Log In
              </Link>
              <Link className="button button-landing-primary" to="/auth">
                Book A Demo
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
