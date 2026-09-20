import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";

const NAV_LINKS = [
  { label: "Product", href: "#product" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Stack", href: "#stack" },
  { label: "Built for LA", href: "#built-for" },
  { label: "Security", href: "#security" },
];

export function LandingHeader() {
  const viewer = useQuery(api.users.viewer);
  const { signOut } = useAuthActions();
  const signedIn = Boolean(viewer);
  const startHref = signedIn ? "/projects/new" : "/auth";

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
          {NAV_LINKS.map((item) => (
            <a key={item.label} className="landing-nav-link" href={item.href}>
              {item.label}
            </a>
          ))}
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
                Start a project
              </Link>
            </>
          ) : (
            <>
              <Link className="landing-login" to="/auth?mode=signIn">
                Log in
              </Link>
              <Link className="button button-landing-primary" to={startHref}>
                Start a project
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
