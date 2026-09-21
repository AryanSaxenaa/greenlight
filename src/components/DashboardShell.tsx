import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { BrandMark } from "./BrandMark";
import {
  DashboardCommandPalette,
  isMacPlatform,
} from "./DashboardCommandPalette";

type DashboardShellProps = {
  children: ReactNode;
  wide?: boolean;
};

type NavItem = {
  label: string;
  to: string;
  icon: ReactNode;
  end?: boolean;
};

function NavIcon({ children }: { children: ReactNode }) {
  return <span className="dash-nav-icon">{children}</span>;
}

function isActive(pathname: string, to: string, end = false): boolean {
  if (end) {
    return pathname === to;
  }
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function DashboardShell({ children, wide = false }: DashboardShellProps) {
  const location = useLocation();
  const viewer = useQuery(api.users.viewer);
  const { signOut } = useAuthActions();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const shortcutLabel = isMacPlatform() ? "⌘K" : "Ctrl K";

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const primaryNav: NavItem[] = [
    {
      label: "Overview",
      to: "/projects",
      end: true,
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <rect x="2" y="2" width="5" height="5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <rect x="9" y="2" width="5" height="5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <rect x="2" y="9" width="5" height="5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <rect x="9" y="9" width="5" height="5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      ),
    },
    {
      label: "New project",
      to: "/projects/new",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M8 3v10M3 8h10" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  const dataNav: NavItem[] = [
    {
      label: "Projects",
      to: "/projects",
      end: true,
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3 4h10v9H3z" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <path d="M5.5 2.5h5v1.5h-5z" fill="none" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      ),
    },
  ];

  const userLabel = viewer?.name ?? viewer?.email?.split("@")[0] ?? "Account";
  const userInitials = userLabel
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);

  async function handleSignOut() {
    await signOut();
    window.location.assign("/");
  }

  return (
    <div className="dashboard-shell">
      <DashboardCommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <aside className="dash-sidebar">
        <button
          className="dash-sidebar-search"
          type="button"
          aria-label="Open search"
          onClick={() => setPaletteOpen(true)}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span>Search</span>
          <kbd>{shortcutLabel}</kbd>
        </button>

        <nav className="dash-nav" aria-label="Dashboard">
          {primaryNav.map((item) => (
            <Link
              key={item.label}
              className={
                isActive(location.pathname, item.to, item.end)
                  ? "dash-nav-link dash-nav-link-active"
                  : "dash-nav-link"
              }
              to={item.to}
            >
              <NavIcon>{item.icon}</NavIcon>
              {item.label}
            </Link>
          ))}

          <p className="dash-nav-section">Data</p>
          {dataNav.map((item) => (
            <Link
              key={item.label}
              className={
                isActive(location.pathname, item.to, item.end)
                  ? "dash-nav-link dash-nav-link-active"
                  : "dash-nav-link"
              }
              to={item.to}
            >
              <NavIcon>{item.icon}</NavIcon>
              {item.label}
            </Link>
          ))}

          <p className="dash-nav-section">Resources</p>
          <a className="dash-nav-link" href="/#how-it-works">
            <NavIcon>
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
                <path d="M8 7v4M8 5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </NavIcon>
            How it works
          </a>
          <Link className="dash-nav-link" to="/">
            <NavIcon>
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M3 4.5h10M3 8h10M3 11.5h6" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </NavIcon>
            Product site
          </Link>
        </nav>

        <div className="dash-sidebar-foot">
          <div className="dash-whats-new">
            <strong>Permit graph live</strong>
            <p>Compiler stages, sources, and readiness update in real time on Convex.</p>
          </div>

          <div className="dash-user">
            <div className="dash-user-avatar" aria-hidden="true">
              {userInitials || "GL"}
            </div>
            <div className="dash-user-copy">
              <strong>{userLabel}</strong>
              <span>{viewer?.email ?? "Signed in"}</span>
            </div>
            <button className="dash-user-signout" type="button" onClick={() => void handleSignOut()}>
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="dash-main">
        <header className="dash-topbar">
          <div className="dash-topbar-left">
            <Link className="dash-topbar-brand" to="/projects">
              <BrandMark />
              <span>Greenlight</span>
            </Link>
            <span className="dash-workspace-pill">LA Permits</span>
          </div>
          <div className="dash-topbar-right">
            <a className="dash-topbar-link" href="/#security">
              Help
            </a>
            <a className="dash-topbar-link" href="/#stack">
              Docs
            </a>
          </div>
        </header>

        <main className={wide ? "dash-content dash-content-wide" : "dash-content"}>
          {children}
        </main>
      </div>
    </div>
  );
}
