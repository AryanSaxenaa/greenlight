import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type AppHeaderProps = {
  action?: ReactNode;
  meta?: ReactNode;
  sticky?: boolean;
};

export function AppHeader({ action, meta, sticky = false }: AppHeaderProps) {
  return (
    <header className={sticky ? "topbar topbar-sticky" : "topbar"}>
      <Link className="brand" to="/">
        <svg
          className="brand-mark"
          width="14"
          height="14"
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
        <span className="brand-name">Greenlight</span>
      </Link>
      {meta ? <div className="topbar-meta">{meta}</div> : null}
      {action ? <div className="topbar-action">{action}</div> : null}
    </header>
  );
}
