"use client";

import { useMemo, useState } from "react";
import { buildComparisonSeries, canCompareRecord } from "@/lib/valuation/compare-mappers";
import type { PredictionRecord } from "@/lib/valuation/types";
import { ComparisonResultView } from "./comparison-result-view";
import { ComparisonSelectedSummary } from "./comparison-selected-summary";
import { ComparisonSelectionDialog } from "./comparison-selection-dialog";

type ComparisonPageProps = {
  records: PredictionRecord[];
  isLoading?: boolean;
  selectedRecordIds: string[];
  onSetSelection: (ids: string[]) => void;
  onRemoveSelection: (id: string) => void;
  onClearSelection: () => void;
  onCreatePrediction?: () => void;
};

export function ComparisonPage({
  records,
  isLoading = false,
  selectedRecordIds,
  onSetSelection,
  onRemoveSelection,
  onClearSelection,
  onCreatePrediction,
}: ComparisonPageProps) {
  const [selectionDialogOpen, setSelectionDialogOpen] = useState(false);

  const selectedRecords = useMemo(() => {
    return selectedRecordIds
      .map((recordId) => records.find((item) => item.id === recordId))
      .filter((item): item is PredictionRecord => Boolean(item));
  }, [records, selectedRecordIds]);

  const series = useMemo(() => buildComparisonSeries(records, selectedRecordIds), [records, selectedRecordIds]);
  const invalidSelectionCount = selectedRecordIds.length - selectedRecords.filter(canCompareRecord).length;

  return (
    <section className="valuation-page-section" aria-labelledby="valuation-comparison-title">
      <header className="valuation-page-head">
        <h2 className="valuation-page-title" id="valuation-comparison-title">
          Comparation Tool
        </h2>
        <p className="valuation-page-subtitle">
          Search and select prediction records to compare property features and predicted prices.
        </p>
      </header>

      <ComparisonSelectedSummary
        selectedRecords={selectedRecords}
        selectedCount={selectedRecordIds.length}
        invalidSelectionCount={invalidSelectionCount}
        onOpenSelection={() => setSelectionDialogOpen(true)}
        onRemove={onRemoveSelection}
        onClear={onClearSelection}
      />

      <ComparisonResultView
        recordsCount={records.length}
        selectedCount={selectedRecordIds.length}
        series={series}
        onOpenSelection={() => setSelectionDialogOpen(true)}
        onCreatePrediction={onCreatePrediction}
      />

      {selectionDialogOpen ? (
        <ComparisonSelectionDialog
          open={selectionDialogOpen}
          records={records}
          isLoading={isLoading}
          selectedRecordIds={selectedRecordIds}
          onConfirm={(recordIds) => {
            onSetSelection(recordIds);
            setSelectionDialogOpen(false);
          }}
          onClose={() => setSelectionDialogOpen(false)}
        />
      ) : null}
    </section>
  );
}
