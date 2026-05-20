"use client";

import { formatNumber, formatPercent, formatUsd, formatUsdPerSqFt } from "@/lib/analysis/format";

type KpiCardProps = {
  label: string;
  value: number;
  format: "count" | "usd" | "usdPerSqFt";
  delta?: number;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
};

function formatValue(value: number, format: KpiCardProps["format"]): string {
  if (format === "count") {
    return formatNumber(value);
  }

  if (format === "usdPerSqFt") {
    return formatUsdPerSqFt(value);
  }

  return formatUsd(value);
}

export function KpiCard({ label, value, format, delta, loading, error, onRetry }: KpiCardProps) {
  const deltaClass =
    delta === undefined ? "" : delta >= 0 ? "analysis-kpi-delta-up" : "analysis-kpi-delta-down";

  return (
    <article className="analysis-kpi-card" aria-labelledby={`kpi-${label}`}>
      <h3 id={`kpi-${label}`} className="analysis-kpi-label">
        {label}
      </h3>

      {loading ? (
        <div className="analysis-kpi-skeleton" aria-hidden />
      ) : error ? (
        <div className="analysis-kpi-error">
          <span aria-hidden>--</span>
          {onRetry ? (
            <button type="button" className="valuation-inline-btn" onClick={onRetry}>
              Retry
            </button>
          ) : null}
        </div>
      ) : (
        <>
          <p className="analysis-kpi-value">{formatValue(value, format)}</p>
          {delta !== undefined ? (
            <p className={`analysis-kpi-delta ${deltaClass}`}>
              {formatPercent(delta)} vs market baseline
            </p>
          ) : null}
        </>
      )}
    </article>
  );
}
