import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PortalApp } from "@/lib/portal/types";
import { PortalAppIcon } from "./portal-app-icon";

type ApplicationGridProps = {
  applications: PortalApp[];
  isLoading: boolean;
};

export function ApplicationGrid({ applications, isLoading }: ApplicationGridProps) {
  if (isLoading) {
    return (
      <div className="portal-app-grid" aria-hidden>
        {Array.from({ length: 6 }).map((_, index) => (
          <article className="portal-app-card portal-app-skeleton" key={index} />
        ))}
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="portal-section-feedback" role="status">
        <p>No applications found for this filter. Try adjusting keyword or category.</p>
      </div>
    );
  }

  return (
    <div className="portal-app-grid">
      {applications.map((app) => {
        const isExternal = Boolean(app.isExternal);

        return (
          <article className="portal-app-card" key={app.id}>
            <div className="portal-app-card-head">
              <span className="portal-shortcut-icon">
                <PortalAppIcon icon={app.icon} context="application" />
              </span>
              <span className="portal-app-category">{app.category}</span>
            </div>

            <h2 className="portal-card-title">{app.name}</h2>
            <p className="portal-card-description">{app.description}</p>

            <Link
              className="portal-inline-link"
              href={app.href}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
            >
              Open {app.name}
              <ArrowRight aria-hidden size={14} />
            </Link>
          </article>
        );
      })}
    </div>
  );
}
