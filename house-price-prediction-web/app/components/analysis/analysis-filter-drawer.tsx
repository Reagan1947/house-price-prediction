"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { AnalysisFilterDraft, AnalysisFilterErrors } from "@/lib/analysis/filters";
import { AnalysisDimensionFilters } from "./analysis-dimension-filters";

type AnalysisFilterDrawerProps = {
  draft: AnalysisFilterDraft;
  errors: AnalysisFilterErrors;
  onDraftChange: (draft: AnalysisFilterDraft) => void;
  onApply: () => void;
  onCleanDraft: () => void;
};

export function AnalysisFilterDrawer({
  draft,
  errors,
  onDraftChange,
  onApply,
  onCleanDraft,
}: AnalysisFilterDrawerProps) {
  const formId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open]);

  return (
    <div className="analysis-filter-drawer-wrap">
      <button
        ref={triggerRef}
        type="button"
        className="valuation-btn valuation-btn-secondary analysis-filter-drawer-trigger"
        onClick={() => setOpen(true)}
      >
        <SlidersHorizontal aria-hidden size={16} />
        Data Filters
      </button>

      {open ? (
        <div className="analysis-filter-drawer-overlay" role="presentation" onClick={() => setOpen(false)}>
          <aside
            className="analysis-filter-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${formId}-drawer-title`}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="analysis-filter-drawer-head">
              <h2 id={`${formId}-drawer-title`}>Data Filters</h2>
              <button
                type="button"
                className="analysis-icon-btn"
                aria-label="Close filters"
                onClick={() => setOpen(false)}
              >
                <X aria-hidden size={18} />
              </button>
            </header>

            <form
              className="analysis-filter-drawer-form"
              onSubmit={(event) => {
                event.preventDefault();
                onApply();
                setOpen(false);
              }}
            >
              <AnalysisDimensionFilters
                formId={`${formId}-drawer`}
                draft={draft}
                errors={errors}
                onDraftChange={onDraftChange}
              />

              <div className="analysis-filter-drawer-actions">
                <button type="submit" className="valuation-btn valuation-btn-primary">
                  Apply filters
                </button>
                <button
                  type="button"
                  className="valuation-btn valuation-btn-secondary"
                  onClick={onCleanDraft}
                >
                  Clear all filters
                </button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
