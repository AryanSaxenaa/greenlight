import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type AppHeaderProps = {
  action?: ReactNode;
  meta?: ReactNode;
};

export function AppHeader({ action, meta }: AppHeaderProps) {
  return (
    <header className="topbar">
      <Link className="brand" to="/">
        <span className="brand-mark" aria-hidden="true" />
        <span className="brand-name">Greenlight</span>
      </Link>
      {meta ? <div className="topbar-meta">{meta}</div> : null}
      {action ? <div className="topbar-action">{action}</div> : null}
    </header>
  );
}
