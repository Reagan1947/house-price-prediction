"use client";

import type { PredictionRecord } from "@/lib/valuation/types";

type ComparisonSelectedSummaryProps = {
  selectedRecords: PredictionRecord[];
  selectedCount: number;
  invalidSelectionCount?: number;
  onOpenSelection: () => void;
  onRemove: (id: string) => void;
  onClear: () => void;
};

function formatMoney(value: number | null): string {
  if (value === null) {
    return "No prediction";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ComparisonSelectedSummary({
  selectedRecords,
  selectedCount,
  invalidSelectionCount = 0,
  onOpenSelection,
  onRemove,
  onClear,
}: ComparisonSelectedSummaryProps) {
  const hasSelection = selectedCount > 0;

  return (
    <div className="valuation-selection-card valuation-selected-summary-card">
      <div className="valuation-selection-head">
        <div>
          <strong aria-live="polite">Selected: {selectedCount}</strong>
          <p className="valuation-selection-helper">
            Select at least two prediction records with predicted prices to compare property features and predicted prices.
          </p>
        </div>
        <div className="valuation-selection-actions">
          <button type="button" className="valuation-btn valuation-btn-primary" onClick={onOpenSelection}>
            {hasSelection ? "Change Selection" : "Select Data to Compare"}
          </button>
          <button type="button" className="valuation-btn valuation-btn-secondary" onClick={onClear} disabled={!hasSelection}>
            Clear Selection
          </button>
        </div>
      </div>

      {invalidSelectionCount > 0 ? (
        <div className="valuation-feedback valuation-feedback-warning" role="status">
          <p>{invalidSelectionCount} selected record(s) are no longer available or cannot be compared.</p>
        </div>
      ) : null}

      {selectedRecords.length > 0 ? (
        <div className="valuation-selected-record-grid">
          {selectedRecords.map((record) => (
            <article key={record.id} className="valuation-selected-record-card" aria-label={`Selected record ${record.title}`}>
              <div className="valuation-selected-record-head">
                <div>
                  <h3>{record.title}</h3>
                  <p>{record.id} - {record.location}</p>
                </div>
                <button type="button" className="valuation-inline-btn" onClick={() => onRemove(record.id)}>
                  Remove
                </button>
              </div>
              <dl className="valuation-selected-record-details">
                <div>
                  <dt>Price</dt>
                  <dd>{formatMoney(record.predictedPrice)}</dd>
                </div>
                <div>
                  <dt>Sq ft</dt>
                  <dd>{record.features.squareFootage}</dd>
                </div>
                <div>
                  <dt>Bedrooms</dt>
                  <dd>{record.features.bedrooms}</dd>
                </div>
                <div>
                  <dt>School</dt>
                  <dd>{record.features.schoolRating}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <p className="valuation-selection-empty">No records selected yet.</p>
      )}
    </div>
  );
}
