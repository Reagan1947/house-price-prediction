import Link from "next/link";
import { ArrowRight, RefreshCw } from "lucide-react";
import type { PortalApp } from "@/lib/portal/types";
import { PortalAppIcon } from "./portal-app-icon";

type ShortcutSectionProps = {
  shortcuts: PortalApp[];
  isLoading: boolean;
  error?: string;
  onRetry: () => void;
};

export function ShortcutSection({ shortcuts, isLoading, error, onRetry }: ShortcutSectionProps) {
  return (
    <section className="portal-section" aria-labelledby="portal-shortcut-title">
      <h2 className="portal-section-title" id="portal-shortcut-title">
        Shortcut
      </h2>

      {isLoading ? (
        <div className="portal-shortcut-grid" aria-hidden>
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="portal-shortcut-skeleton" />
          ))}
        </div>
      ) : null}

      {!isLoading && error ? (
        <div className="portal-section-feedback" role="alert">
          <p>{error}</p>
          <button type="button" className="portal-inline-btn" onClick={onRetry}>
            <RefreshCw aria-hidden size={14} />
            Retry
          </button>
        </div>
      ) : null}

      {!isLoading && !error && shortcuts.length === 0 ? (
        <div className="portal-section-feedback" role="status">
          <p>No applications available right now.</p>
          <Link href="/portal/applications" className="portal-inline-link">
            Browse applications
          </Link>
        </div>
      ) : null}

      {!isLoading && !error && shortcuts.length > 0 ? (
        <div className="portal-shortcut-grid">
          {shortcuts.map((app) => {
            const isExternal = Boolean(app.isExternal);

            return (
              <Link
                key={app.id}
                href={app.href}
                className="portal-shortcut-card"
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
              >
                <span className="portal-shortcut-icon">
                  <PortalAppIcon icon={app.icon} context="shortcut" />
                </span>
                <span className="portal-shortcut-name">{app.name}</span>
                <ArrowRight aria-hidden size={14} />
              </Link>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
