import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { BrandMark } from "./BrandMark";

type AppHeaderProps = {
  action?: ReactNode;
  meta?: ReactNode;
};

export function AppHeader({ action, meta }: AppHeaderProps) {
  return (
    <header className="site-header">
      <div className="shell site-header-inner">
        <Link className="brand" to="/">
          <BrandMark size={12} />
          <span className="brand-name">Greenlight</span>
        </Link>
        {meta ? <div className="topbar-meta">{meta}</div> : null}
        {action ? <div className="topbar-action">{action}</div> : null}
      </div>
    </header>
  );
}
