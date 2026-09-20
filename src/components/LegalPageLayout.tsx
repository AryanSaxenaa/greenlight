import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { AppPageLayout } from "./AppPageLayout";
import { PageMeta } from "./PageMeta";

type LegalPageLayoutProps = {
  title: string;
  description: string;
  path: string;
  children: ReactNode;
};

export function LegalPageLayout({
  title,
  description,
  path,
  children,
}: LegalPageLayoutProps) {
  return (
    <AppPageLayout>
      <PageMeta title={title} description={description} path={path} />
      <article className="app-card legal-page">
        <p className="landing-section-kicker">Legal</p>
        <h1 className="app-card-title">{title}</h1>
        <div className="legal-page-body">{children}</div>
        <p className="app-card-foot">
          <Link to="/">Back to home</Link>
          {" · "}
          <Link to="/privacy">Privacy</Link>
          {" · "}
          <Link to="/terms">Terms</Link>
        </p>
      </article>
    </AppPageLayout>
  );
}
