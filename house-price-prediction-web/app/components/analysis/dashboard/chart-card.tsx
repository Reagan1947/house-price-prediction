"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ChartCardProps = {
  className?: string;
  title: string;
  description: string;
  empty?: boolean;
  error?: string | null;
  onRetry?: () => void;
  children: ReactNode;
};

export function ChartCard({
  className,
  title,
  description,
  empty,
  error,
  onRetry,
  children,
}: ChartCardProps) {
  const titleId = useId();

  return (
    <section
      className={cn("valuation-chart-card analysis-chart-card", className)}
      aria-labelledby={`${titleId}-title`}
    >
      <header className="analysis-chart-card-head">
        <div>
          <h3 id={`${titleId}-title`} className="analysis-chart-title">
            {title}
          </h3>
          <p className="analysis-chart-description">{description}</p>
        </div>
      </header>

      {empty ? <p className="analysis-chart-empty">No data for current filters.</p> : null}
      {error ? (
        <div className="analysis-chart-error" role="alert">
          <p>{error}</p>
          {onRetry ? (
            <button type="button" className="valuation-inline-btn" onClick={onRetry}>
              Retry
            </button>
          ) : null}
        </div>
      ) : (
        children
      )}
    </section>
  );
}
