"use client";

import { useMemo, useState } from "react";
import type { PredictionRecord } from "@/lib/valuation/types";
import { PredictionFilterBar, type PredictionFilters } from "./prediction-filter-bar";
import { EMPTY_PREDICTION_FILTERS, filterPredictionRecords } from "./prediction-filtering";
import { PredictionTable } from "./prediction-table";

type PredictionPageProps = {
  records: PredictionRecord[];
  isLoading: boolean;
  highlightPredictionId?: string;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  onReuse: (id: string) => void;
  selectedForComparison?: string[];
  onToggleCompare?: (id: string) => void;
};

export function PredictionPage({
  records,
  isLoading,
  highlightPredictionId,
  onCreate,
  onDelete,
  onView,
  onReuse,
  selectedForComparison = [],
  onToggleCompare,
}: PredictionPageProps) {
  const [draftFilters, setDraftFilters] = useState<PredictionFilters>(EMPTY_PREDICTION_FILTERS);
  const [queryFilters, setQueryFilters] = useState<PredictionFilters>(EMPTY_PREDICTION_FILTERS);

  const filtered = useMemo(() => filterPredictionRecords(records, queryFilters), [queryFilters, records]);

  return (
    <section className="valuation-page-section" aria-labelledby="valuation-prediction-title">
      <header className="valuation-page-head">
        <h2 className="valuation-page-title" id="valuation-prediction-title">
          Prediction
        </h2>
        <p className="valuation-page-subtitle">
          Search historical prediction records, inspect details, and create new house price predictions.
        </p>
      </header>

      <PredictionFilterBar
        filters={draftFilters}
        onFilterChange={(key, value) => {
          setDraftFilters((current) => ({
            ...current,
            [key]: value,
          }));
        }}
        onApply={() => {
          setQueryFilters(draftFilters);
        }}
        onReset={() => {
          setDraftFilters(EMPTY_PREDICTION_FILTERS);
          setQueryFilters(EMPTY_PREDICTION_FILTERS);
        }}
        onCreate={onCreate}
        isLoading={isLoading}
      />

      <PredictionTable
        key={JSON.stringify(queryFilters)}
        records={filtered}
        isLoading={isLoading}
        highlightPredictionId={highlightPredictionId}
        onDelete={onDelete}
        onView={onView}
        onReuse={onReuse}
        showCompareColumn={Boolean(onToggleCompare)}
        selectedForComparison={selectedForComparison}
        onToggleCompare={onToggleCompare}
      />
    </section>
  );
}
