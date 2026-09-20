import type { ReactNode } from "react";
import { LandingHeader } from "./LandingHeader";

type AppPageLayoutProps = {
  children: ReactNode;
  signedIn?: boolean;
  wide?: boolean;
};

export function AppPageLayout({
  children,
  signedIn = false,
  wide = false,
}: AppPageLayoutProps) {
  return (
    <div className="page page-app">
      <div className="app-page-wrap">
        <div className={wide ? "app-shell app-shell-wide" : "app-shell"}>
          <LandingHeader signedIn={signedIn} />
          <main className={wide ? "app-main app-main-wide" : "app-main"}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
