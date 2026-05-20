"use client";

import { formatUsd } from "@/lib/analysis/format";
import type { PredictionRecord } from "@/lib/valuation/types";

type AnalysisDataCardsProps = {
  rows: PredictionRecord[];
  highlightId?: string;
  onView: (record: PredictionRecord) => void;
  onUseBaseline: (record: PredictionRecord) => void;
  onAddCompare: (record: PredictionRecord) => void;
};

export function AnalysisDataCards({
  rows,
  highlightId,
  onView,
  onUseBaseline,
  onAddCompare,
}: AnalysisDataCardsProps) {
  return (
    <ul className="analysis-data-cards" aria-label="Analysis records">
      {rows.map((record) => (
        <li key={record.id}>
          <article
            className={`analysis-data-card${highlightId === record.id ? " analysis-data-card-highlight" : ""}`}
            role="article"
            aria-labelledby={`card-${record.id}-title`}
          >
            <header>
              <h3 id={`card-${record.id}-title`}>{record.title}</h3>
              <p className="analysis-data-card-meta">
                {record.id} · {record.location}
              </p>
            </header>
            <p className="analysis-data-card-price">{formatUsd(record.predictedPrice ?? 0)}</p>
            <div className="analysis-data-card-chips">
              <span>{record.features.bedrooms} bd</span>
              <span>{record.features.squareFootage} sq.ft.</span>
              <span>Built {record.features.yearBuilt}</span>
            </div>
            <div className="analysis-data-card-actions">
              <button type="button" className="valuation-inline-btn" onClick={() => onView(record)}>
                View
              </button>
              <button type="button" className="valuation-inline-btn" onClick={() => onUseBaseline(record)}>
                Use as Baseline
              </button>
              <button type="button" className="valuation-inline-btn" onClick={() => onAddCompare(record)}>
                Add to Compare
              </button>
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
