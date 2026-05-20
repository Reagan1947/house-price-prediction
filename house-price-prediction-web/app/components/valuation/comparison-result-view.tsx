"use client";

import { useEffect, useState } from "react";
import type { ComparisonSeries } from "@/lib/valuation/types";
import { ComparisonDataTable } from "./comparison-data-table";
import { ComparisonPriceChart } from "./comparison-price-chart";
import { ComparisonRadarChart } from "./comparison-radar-chart";

type ComparisonResultViewProps = {
  recordsCount: number;
  selectedCount: number;
  series: ComparisonSeries[];
  onOpenSelection: () => void;
  onCreatePrediction?: () => void;
};

export function ComparisonResultView({
  recordsCount,
  selectedCount,
  series,
  onOpenSelection,
  onCreatePrediction,
}: ComparisonResultViewProps) {
  if (recordsCount === 0) {
    return (
      <div className="valuation-feedback" role="status">
        <p>No prediction records are available. Create a prediction first.</p>
        {onCreatePrediction ? (
          <button type="button" className="valuation-inline-btn" onClick={onCreatePrediction}>
            Create Prediction
          </button>
        ) : null}
      </div>
    );
  }

  if (selectedCount === 0) {
    return null;
  }

  if (selectedCount < 2 || series.length < 2) {
    return (
      <div className="valuation-feedback" role="status">
        <p>Please select at least two records with prediction prices to generate comparison charts.</p>
        <button type="button" className="valuation-inline-btn" onClick={onOpenSelection}>
          Change Selection
        </button>
      </div>
    );
  }

  return <ComparisonChartGrid series={series} />;
}

function ComparisonChartGrid({ series }: { series: ComparisonSeries[] }) {
  const [focusedRecordId, setFocusedRecordId] = useState<string | null>(null);

  useEffect(() => {
    setFocusedRecordId((current) => {
      if (!current) {
        return null;
      }

      return series.some((item) => item.recordId === current) ? current : null;
    });
  }, [series]);

  const handleFocusRecord = (recordId: string) => {
    setFocusedRecordId((current) => (current === recordId ? null : recordId));
  };

  return (
    <div className="valuation-chart-grid">
      <ComparisonRadarChart series={series} focusedRecordId={focusedRecordId} onFocusRecord={handleFocusRecord} />
      <ComparisonPriceChart series={series} focusedRecordId={focusedRecordId} onFocusRecord={handleFocusRecord} />
      <ComparisonDataTable series={series} focusedRecordId={focusedRecordId} onFocusRecord={handleFocusRecord} />
    </div>
  );
}
