"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useId, useState } from "react";
import {
  applyValidatedAnalysisFilters,
  filtersToDraft,
  hasAnalysisFilterErrors,
  resetDimensionFilterDraft,
  validateAnalysisFilterDraft,
  type AnalysisFilterDraft,
  type AnalysisFilterErrors,
} from "@/lib/analysis/filters";
import type { AnalysisFilterInput } from "@/lib/analysis/types";
import { AnalysisDimensionFilters } from "./analysis-dimension-filters";
import { AnalysisFilterDrawer } from "./analysis-filter-drawer";

type AnalysisFilterBarProps = {
  filters: AnalysisFilterInput;
  onApply: (filters: AnalysisFilterInput) => void;
};

export function AnalysisFilterBar({
  filters,
  onApply,
}: AnalysisFilterBarProps) {
  const formId = useId();
  const [draft, setDraft] = useState<AnalysisFilterDraft>(() => filtersToDraft(filters));
  const [errors, setErrors] = useState<AnalysisFilterErrors>({});
  const [collapsed, setCollapsed] = useState(false);
  const contentId = `${formId}-content`;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync draft when URL filters change externally
    setDraft(filtersToDraft(filters));
  }, [filters]);

  const handleApply = () => {
    const validated = validateAnalysisFilterDraft(draft);
    setErrors(validated.errors);
    if (hasAnalysisFilterErrors(validated.errors)) {
      return;
    }

    onApply(applyValidatedAnalysisFilters(filters, validated.filters, { page: 1 }));
  };

  const handleCleanDraft = () => {
    setDraft((current) => resetDimensionFilterDraft(current));
    setErrors({});
  };

  const handleDraftChange = (nextDraft: AnalysisFilterDraft) => {
    setDraft(nextDraft);
    setErrors({});
  };

  return (
    <section className="analysis-filter-bar" aria-labelledby={`${formId}-title`}>
      <div className="analysis-filter-bar-head">
        <div className="analysis-panel-heading">
          <h2 id={`${formId}-title`} className="analysis-filter-title">
            Data Filters
          </h2>
          <p className="analysis-panel-description">
            Create and apply numeric range filters to refine the analysis dataset.
          </p>
        </div>
        <button
          type="button"
          className="analysis-panel-toggle"
          aria-expanded={!collapsed}
          aria-controls={contentId}
          onClick={() => setCollapsed((current) => !current)}
        >
          {collapsed ? "Expand" : "Collapse"}
          {collapsed ? <ChevronDown aria-hidden size={16} /> : <ChevronUp aria-hidden size={16} />}
        </button>
      </div>

      {!collapsed ? (
        <div id={contentId}>
          <form
            className="analysis-filter-form analysis-filter-form-desktop"
            onSubmit={(event) => {
              event.preventDefault();
              handleApply();
            }}
          >
            <div className="analysis-filter-form-layout">
              <div className="analysis-filter-form-fields">
                <AnalysisDimensionFilters
                  formId={formId}
                  draft={draft}
                  errors={errors}
                  onDraftChange={handleDraftChange}
                />
              </div>
              <div className="analysis-filter-form-actions">
                <button type="submit" className="valuation-btn valuation-btn-primary">
                  Apply filters
                </button>
                <button
                  type="button"
                  className="valuation-btn valuation-btn-secondary"
                  onClick={handleCleanDraft}
                >
                  Clear all filters
                </button>
              </div>
            </div>
          </form>

          <AnalysisFilterDrawer
            draft={draft}
            errors={errors}
            onDraftChange={handleDraftChange}
            onApply={handleApply}
            onCleanDraft={handleCleanDraft}
          />
        </div>
      ) : null}
    </section>
  );
}
