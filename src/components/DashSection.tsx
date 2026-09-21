import type { ReactNode } from "react";

type DashSectionProps = {
  kicker?: string;
  title?: string;
  children: ReactNode;
  variant?: "default" | "module" | "highlight";
  className?: string;
};

export function DashSection({
  kicker,
  title,
  children,
  variant = "default",
  className,
}: DashSectionProps) {
  const classes = [
    variant === "module"
      ? "dash-module"
      : variant === "highlight"
        ? "dash-section dash-section-highlight"
        : "dash-section",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={classes}>
      {kicker ? <span className="dash-section-kicker">{kicker}</span> : null}
      {title ? <h3 className="dash-section-title">{title}</h3> : null}
      {children}
    </section>
  );
}
