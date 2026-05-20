import Link from "next/link";
import { ArrowRight, RefreshCw } from "lucide-react";
import type { AdviceItem } from "@/lib/portal/types";

type AdviceSectionProps = {
  advices: AdviceItem[];
  isLoading: boolean;
  error?: string;
  onRetry: () => void;
};

export function AdviceSection({ advices, isLoading, error, onRetry }: AdviceSectionProps) {
  return (
    <section className="portal-section" aria-labelledby="portal-advice-title">
      <h2 className="portal-section-title" id="portal-advice-title">
        Advice
      </h2>

      {isLoading ? (
        <div className="portal-advice-grid" aria-hidden>
          {Array.from({ length: 2 }).map((_, index) => (
            <article key={index} className="portal-advice-card portal-advice-skeleton" />
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

      {!isLoading && !error && advices.length === 0 ? (
        <div className="portal-section-feedback" role="status">
          <p>No advice available at this moment.</p>
          <Link href="/portal/applications" className="portal-inline-link">
            Browse all applications
          </Link>
        </div>
      ) : null}

      {!isLoading && !error && advices.length > 0 ? (
        <div className="portal-advice-grid">
          {advices.map((advice) => (
            <article className="portal-advice-card" key={advice.id}>
              <h3 className="portal-card-title">{advice.title}</h3>
              <p className="portal-card-description">{advice.content}</p>
              <Link href={advice.actionHref} className="portal-inline-link">
                {advice.actionText}
                <ArrowRight aria-hidden size={14} />
              </Link>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
