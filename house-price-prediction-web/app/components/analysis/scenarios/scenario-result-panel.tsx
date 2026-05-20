"use client";

import { buildFeatureDiffRows } from "@/lib/analysis/scenarios";
import { formatDeltaUsd, formatPercent, formatScenarioDiff, formatUsd } from "@/lib/analysis/format";
import type { ScenarioResult } from "@/lib/analysis/types";

type ScenarioResultPanelProps = {
  result: ScenarioResult | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
};

export function ScenarioResultPanel({ result, loading, error, onRetry }: ScenarioResultPanelProps) {
  if (loading) {
    return <p className="analysis-scenario-status" role="status">Running scenario...</p>;
  }

  if (error) {
    return (
      <div className="valuation-feedback valuation-feedback-danger" role="alert">
        <p>{error}</p>
        {onRetry ? (
          <button type="button" className="valuation-inline-btn" onClick={onRetry}>
            Retry
          </button>
        ) : null}
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const diffRows = buildFeatureDiffRows(result.baseline.features, result.scenarioFeatures);
  const isUnchanged = result.delta === 0;
  const deltaClass = isUnchanged
    ? "analysis-kpi-delta-neutral"
    : result.delta > 0
      ? "analysis-kpi-delta-up"
      : "analysis-kpi-delta-down";
  const deltaPercentLabel =
    result.deltaPercent === null ? "-" : formatPercent(result.deltaPercent);
  const deltaSummary = isUnchanged
    ? "Unchanged vs baseline"
    : `${deltaPercentLabel} ${result.delta > 0 ? "higher" : "lower"} than baseline`;

  return (
    <section className="analysis-scenario-result" aria-label="Scenario results" role="status">
      <div className="analysis-scenario-compare-grid" role="group" aria-label="Price comparison">
        <article className="analysis-kpi-card" aria-labelledby="scenario-result-baseline-label">
          <h3 id="scenario-result-baseline-label" className="analysis-kpi-label">
            Baseline
          </h3>
          <p className="analysis-kpi-value">{formatUsd(result.baseline.predictedPrice)}</p>
        </article>
        <article className="analysis-kpi-card" aria-labelledby="scenario-result-scenario-label">
          <h3 id="scenario-result-scenario-label" className="analysis-kpi-label">
            Scenario
          </h3>
          <p className="analysis-kpi-value">{formatUsd(result.scenarioPrice)}</p>
        </article>
        <article className="analysis-kpi-card" aria-labelledby="scenario-result-change-label">
          <h3 id="scenario-result-change-label" className="analysis-kpi-label">
            Change
          </h3>
          <p className={`analysis-kpi-value ${deltaClass}`}>{formatDeltaUsd(result.delta)}</p>
          <p className={`analysis-kpi-delta ${deltaClass}`}>{deltaSummary}</p>
        </article>
      </div>

      <div className="valuation-table-panel analysis-table-panel analysis-scenario-result-table-panel">
        <div className="valuation-table-shell">
          <table className="valuation-table valuation-data-table valuation-data-table-compact analysis-scenario-diff-table">
            <caption className="sr-only">Feature differences</caption>
            <thead>
              <tr>
                <th scope="col">Feature</th>
                <th scope="col" className="valuation-table-cell-numeric">
                  Baseline
                </th>
                <th scope="col" className="valuation-table-cell-numeric">
                  Scenario
                </th>
                <th scope="col" className="valuation-table-cell-numeric">
                  Diff
                </th>
              </tr>
            </thead>
            <tbody>
              {diffRows.map((row, index) => (
                <tr
                  key={row.key}
                  className={index % 2 === 1 ? "valuation-table-row-striped" : undefined}
                >
                  <th scope="row">{row.label}</th>
                  <td className="valuation-table-cell-numeric tabular-nums">{row.baseline}</td>
                  <td className="valuation-table-cell-numeric tabular-nums">{row.scenario}</td>
                  <td className="valuation-table-cell-numeric tabular-nums">
                    {formatScenarioDiff(row.diff)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
