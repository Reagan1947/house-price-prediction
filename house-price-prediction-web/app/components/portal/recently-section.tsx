import Link from "next/link";
import { ArrowRight, RefreshCw } from "lucide-react";
import type { RecentActivity } from "@/lib/portal/types";

type RecentlySectionProps = {
  activities: RecentActivity[];
  isLoading: boolean;
  error?: string;
  onRetry: () => void;
};

export function RecentlySection({ activities, isLoading, error, onRetry }: RecentlySectionProps) {
  return (
    <section className="portal-section" aria-labelledby="portal-recently-title">
      <h2 className="portal-section-title" id="portal-recently-title">
        Recently
      </h2>

      {isLoading ? (
        <div className="portal-recent-grid" aria-hidden>
          {Array.from({ length: 2 }).map((_, index) => (
            <article className="portal-recent-card portal-recent-skeleton" key={index} />
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

      {!isLoading && !error && activities.length === 0 ? (
        <div className="portal-section-feedback" role="status">
          <p>You have no recent activity yet.</p>
        </div>
      ) : null}

      {!isLoading && !error && activities.length > 0 ? (
        <div className="portal-recent-grid">
          {activities.map((item) => (
            <article className="portal-recent-card" key={item.id}>
              <h3 className="portal-card-title">{item.title}</h3>
              <dl className="portal-recent-details">
                <div>
                  <dt>Location</dt>
                  <dd>{item.location}</dd>
                </div>
                <div>
                  <dt>Prediction ID</dt>
                  <dd>{item.predictionId}</dd>
                </div>
                <div>
                  <dt>Date</dt>
                  <dd>{item.date}</dd>
                </div>
              </dl>
              <Link href={item.reopenHref} className="portal-inline-link">
                Reopen {item.title}
                <ArrowRight aria-hidden size={14} />
              </Link>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
