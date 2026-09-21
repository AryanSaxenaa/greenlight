import type { ReactNode } from "react";
import { DashboardShell } from "./DashboardShell";
import { LandingHeader } from "./LandingHeader";

type AppPageLayoutProps = {
  children: ReactNode;
  wide?: boolean;
  variant?: "dashboard" | "marketing";
};

export function AppPageLayout({
  children,
  wide = false,
  variant = "dashboard",
}: AppPageLayoutProps) {
  if (variant === "marketing") {
    return (
      <div className="page page-app page-app-marketing">
        <div className="app-page-wrap">
          <div className={wide ? "app-shell app-shell-wide" : "app-shell"}>
            <LandingHeader />
            <main className={wide ? "app-main app-main-wide" : "app-main"}>
              {children}
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-app page-app-dashboard">
      <DashboardShell wide={wide}>{children}</DashboardShell>
    </div>
  );
}
