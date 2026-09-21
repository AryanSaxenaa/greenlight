import type { ReactNode } from "react";

type DashPageHeaderProps = {
  title: string;
  description: ReactNode;
  actions?: ReactNode;
};

export function DashPageHeader({ title, description, actions }: DashPageHeaderProps) {
  return (
    <header className="dash-page-header">
      <div className="dash-page-header-copy">
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions ? <div className="dash-page-header-actions">{actions}</div> : null}
    </header>
  );
}
