import { useQuery } from "convex/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";

type DashboardCommandPaletteProps = {
  open: boolean;
  onClose: () => void;
};

type CommandItem =
  | { kind: "nav"; label: string; hint?: string; to: string }
  | { kind: "project"; label: string; hint: string; to: string };

const NAV_ITEMS: CommandItem[] = [
  { kind: "nav", label: "Overview", hint: "All projects", to: "/projects" },
  { kind: "nav", label: "New project", hint: "Start a permit compile", to: "/projects/new" },
  { kind: "nav", label: "Product site", hint: "Marketing pages", to: "/" },
];

export function DashboardCommandPalette({ open, onClose }: DashboardCommandPaletteProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const projects = useQuery(api.projects.list, open ? {} : "skip");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const items = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const projectItems: CommandItem[] =
      projects?.map((project) => ({
        kind: "project" as const,
        label: project.title,
        hint: project.address,
        to: `/projects/${project._id}`,
      })) ?? [];

    const combined = [...NAV_ITEMS, ...projectItems];
    if (!normalized) {
      return combined;
    }

    return combined.filter(
      (item) =>
        item.label.toLowerCase().includes(normalized) ||
        item.hint?.toLowerCase().includes(normalized),
    );
  }, [projects, query]);

  if (!open) {
    return null;
  }

  function go(to: string) {
    navigate(to);
    onClose();
  }

  return (
    <div className="command-palette-backdrop" onClick={onClose}>
      <div
        className="command-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Search projects and navigation"
        onClick={(event) => event.stopPropagation()}
      >
        <label className="command-palette-input-wrap">
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects or jump to..."
            aria-label="Command palette search"
          />
          <kbd>Esc</kbd>
        </label>

        <ul className="command-palette-list">
          {items.length === 0 ? (
            <li className="command-palette-empty">No matches</li>
          ) : (
            items.map((item) => (
              <li key={`${item.kind}-${item.to}-${item.label}`}>
                <button type="button" className="command-palette-item" onClick={() => go(item.to)}>
                  <span className="command-palette-item-label">{item.label}</span>
                  {item.hint ? (
                    <span className="command-palette-item-hint">{item.hint}</span>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

export function isMacPlatform(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}
