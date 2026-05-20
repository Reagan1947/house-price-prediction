"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { formatUsd } from "@/lib/analysis/format";
import type { PredictionRecord } from "@/lib/valuation/types";

type AnalysisRecordDrawerProps = {
  record: PredictionRecord | null;
  onClose: () => void;
  onUseBaseline: (record: PredictionRecord) => void;
  onAddCompare: (record: PredictionRecord) => void;
};

export function AnalysisRecordDrawer({
  record,
  onClose,
  onUseBaseline,
  onAddCompare,
}: AnalysisRecordDrawerProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!record) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    closeRef.current?.focus();

    return () => window.removeEventListener("keydown", handleEscape);
  }, [record, onClose]);

  if (!record) {
    return null;
  }

  return (
    <div className="analysis-drawer-overlay" role="presentation" onClick={onClose}>
      <aside
        className="analysis-record-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="analysis-record-drawer-head">
          <h2 id={titleId}>{record.title}</h2>
          <button ref={closeRef} type="button" className="analysis-icon-btn" aria-label="Close" onClick={onClose}>
            <X aria-hidden size={18} />
          </button>
        </header>

        <dl className="analysis-record-drawer-details">
          <div>
            <dt>ID</dt>
            <dd>{record.id}</dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd>{record.location}</dd>
          </div>
          <div>
            <dt>Predicted price</dt>
            <dd>{formatUsd(record.predictedPrice ?? 0)}</dd>
          </div>
          <div>
            <dt>Square footage</dt>
            <dd>{record.features.squareFootage}</dd>
          </div>
          <div>
            <dt>Bedrooms</dt>
            <dd>{record.features.bedrooms}</dd>
          </div>
          <div>
            <dt>Bathrooms</dt>
            <dd>{record.features.bathrooms}</dd>
          </div>
          <div>
            <dt>Year built</dt>
            <dd>{record.features.yearBuilt}</dd>
          </div>
          <div>
            <dt>School rating</dt>
            <dd>{record.features.schoolRating}</dd>
          </div>
        </dl>

        <footer className="analysis-record-drawer-actions">
          <button type="button" className="valuation-btn valuation-btn-secondary" onClick={() => onUseBaseline(record)}>
            Use as Baseline
          </button>
          <button type="button" className="valuation-btn valuation-btn-primary" onClick={() => onAddCompare(record)}>
            Add to Compare
          </button>
        </footer>
      </aside>
    </div>
  );
}
