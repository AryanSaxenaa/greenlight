import type { ReactNode } from "react";

type DashDisclosureProps = {
  title: string;
  meta?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
};

export function DashDisclosure({
  title,
  meta,
  defaultOpen = false,
  children,
  className,
}: DashDisclosureProps) {
  return (
    <details className={["dash-disclosure", className].filter(Boolean).join(" ")} open={defaultOpen}>
      <summary className="dash-disclosure-summary">
        <span>{title}</span>
        {meta ? <span className="dash-disclosure-meta">{meta}</span> : null}
      </summary>
      <div className="dash-disclosure-body">{children}</div>
    </details>
  );
}
