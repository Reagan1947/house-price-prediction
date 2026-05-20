"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { canCompareRecord } from "@/lib/valuation/compare-mappers";
import type { PredictionRecord } from "@/lib/valuation/types";
import { PredictionFilterBar, type PredictionFilters } from "./prediction-filter-bar";
import { EMPTY_PREDICTION_FILTERS, filterPredictionRecords } from "./prediction-filtering";
import { PredictionTable } from "./prediction-table";
import { ValuationConfirmDialog } from "./valuation-confirm-dialog";

type ComparisonSelectionDialogProps = {
  open: boolean;
  records: PredictionRecord[];
  isLoading?: boolean;
  selectedRecordIds: string[];
  onConfirm: (recordIds: string[]) => void;
  onClose: () => void;
};

function sameSelection(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const next = new Set(a);
  return b.every((item) => next.has(item));
}

export function ComparisonSelectionDialog({
  open,
  records,
  isLoading = false,
  selectedRecordIds,
  onConfirm,
  onClose,
}: ComparisonSelectionDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const [draftFilters, setDraftFilters] = useState<PredictionFilters>(EMPTY_PREDICTION_FILTERS);
  const [queryFilters, setQueryFilters] = useState<PredictionFilters>(EMPTY_PREDICTION_FILTERS);
  const [tempSelectedRecordIds, setTempSelectedRecordIds] = useState<string[]>(Array.from(new Set(selectedRecordIds)));
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setDiscardConfirmOpen(false);
      return;
    }

    setTempSelectedRecordIds(Array.from(new Set(selectedRecordIds)));
    setDraftFilters(EMPTY_PREDICTION_FILTERS);
    setQueryFilters(EMPTY_PREDICTION_FILTERS);
  }, [open, selectedRecordIds]);

  const filtered = useMemo(() => filterPredictionRecords(records, queryFilters), [queryFilters, records]);

  const comparableTempIds = useMemo(() => {
    return tempSelectedRecordIds.filter((recordId) => {
      const record = records.find((item) => item.id === recordId);
      return record ? canCompareRecord(record) : false;
    });
  }, [records, tempSelectedRecordIds]);

  const selectedRecordMap = useMemo(() => new Map(records.map((record) => [record.id, record])), [records]);

  const closeWithDirtyCheck = () => {
    if (!sameSelection(tempSelectedRecordIds, selectedRecordIds)) {
      setDiscardConfirmOpen(true);
      return;
    }

    onClose();
  };

  const handleConfirmDiscard = () => {
    setDiscardConfirmOpen(false);
    onClose();
  };

  const handleCancelDiscard = () => {
    setDiscardConfirmOpen(false);
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (discardConfirmOpen) {
          return;
        }

        event.preventDefault();
        closeWithDirtyCheck();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [discardConfirmOpen, open, selectedRecordIds, tempSelectedRecordIds]);

  const toggleSelection = (recordId: string) => {
    const record = records.find((item) => item.id === recordId);
    if (!record || !canCompareRecord(record)) {
      return;
    }

    setTempSelectedRecordIds((current) => {
      if (current.includes(recordId)) {
        return current.filter((item) => item !== recordId);
      }

      return [...current, recordId];
    });
  };

  const submitSelection = () => {
    if (comparableTempIds.length < 2) {
      return;
    }

    onConfirm(comparableTempIds);
  };

  const portalRoot = typeof document === "undefined" ? null : document.body;

  if (!portalRoot || !open) {
    return null;
  }

  return createPortal(
    <>
    <div className="valuation-dialog-overlay valuation-compare-dialog-overlay" role="presentation">
      <div
        className="valuation-dialog valuation-compare-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <header className="valuation-dialog-header">
          <div>
            <h3 id={titleId} className="valuation-dialog-title">
              Select Data to Compare
            </h3>
            <p id={descriptionId} className="valuation-dialog-description">
              Search prediction records and select at least two with predicted prices to compare.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="valuation-dialog-close"
            aria-label="Close selection dialog"
            onClick={closeWithDirtyCheck}
          >
            <X aria-hidden size={18} />
            <span className="sr-only">Close selection dialog</span>
          </button>
        </header>

        <div className="valuation-dialog-content valuation-compare-dialog-content">
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
            isLoading={isLoading}
          />

          <div className="valuation-compare-selection-status" aria-live="polite">
            <strong>Selected: {comparableTempIds.length}</strong>
            <span>
              {comparableTempIds.length < 2
                ? " Select at least two comparable records."
                : " Ready to confirm selection."}
            </span>
          </div>

          <PredictionTable
            key={JSON.stringify(queryFilters)}
            records={filtered}
            isLoading={isLoading}
            showCompareColumn
            hideActions
            selectedForComparison={tempSelectedRecordIds}
            onToggleCompare={toggleSelection}
            onDelete={() => undefined}
            onView={() => undefined}
            onReuse={() => undefined}
          />

          {comparableTempIds.length > 0 ? (
            <div className="valuation-compare-temp-selection" aria-label="Temporary selected records">
              {comparableTempIds.map((recordId) => {
                const record = selectedRecordMap.get(recordId);
                if (!record) {
                  return null;
                }

                return (
                  <span key={recordId} className="valuation-compare-chip">
                    {record.title}
                    <button type="button" aria-label={`Remove ${record.title}`} onClick={() => toggleSelection(recordId)}>
                      <X aria-hidden size={14} />
                    </button>
                  </span>
                );
              })}
            </div>
          ) : null}
        </div>

        <footer className="valuation-dialog-footer">
          <button type="button" className="valuation-btn valuation-btn-secondary" onClick={closeWithDirtyCheck}>
            Cancel
          </button>
          <button
            type="button"
            className="valuation-btn valuation-btn-primary"
            onClick={submitSelection}
            disabled={comparableTempIds.length < 2}
          >
            Confirm Selection
          </button>
        </footer>
      </div>
    </div>
    <ValuationConfirmDialog
      open={discardConfirmOpen}
      title="Discard selection changes?"
      message="Your compare selection changes have not been confirmed and will be lost."
      cancelLabel="Keep editing"
      confirmLabel="Discard"
      onConfirm={handleConfirmDiscard}
      onCancel={handleCancelDiscard}
    />
    </>,
    portalRoot,
  );
}
