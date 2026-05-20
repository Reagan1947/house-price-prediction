"use client";

import { Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ANALYSIS_FEATURE_DIMENSIONS,
  getDimensionConfig,
} from "@/lib/analysis/filter-dimensions";
import {
  addAnalysisDimensionRow,
  changeAnalysisDimensionRow,
  removeAnalysisDimensionRow,
  sanitizeRangeFilterInput,
  type AnalysisFilterDraft,
  type AnalysisFilterErrors,
} from "@/lib/analysis/filters";
import type { AnalysisRangeDimensionId } from "@/lib/analysis/types";

type AnalysisDimensionFiltersProps = {
  formId: string;
  draft: AnalysisFilterDraft;
  errors: AnalysisFilterErrors;
  onDraftChange: (draft: AnalysisFilterDraft) => void;
};

const RANGE_FIELDS: Record<
  AnalysisRangeDimensionId,
  { min: keyof AnalysisFilterDraft; max: keyof AnalysisFilterDraft }
> = {
  squareFootage: { min: "squareFootageMin", max: "squareFootageMax" },
  bedrooms: { min: "bedroomsMin", max: "bedroomsMax" },
  bathrooms: { min: "bathroomsMin", max: "bathroomsMax" },
  yearBuilt: { min: "yearBuiltMin", max: "yearBuiltMax" },
  lotSize: { min: "lotSizeMin", max: "lotSizeMax" },
  distanceToCityCenter: { min: "distanceToCityCenterMin", max: "distanceToCityCenterMax" },
  schoolRating: { min: "schoolRatingMin", max: "schoolRatingMax" },
};

const FIELD_SELECT_PLACEHOLDER = "Select numeric field";
const RANGE_INPUT_DISABLED_PLACEHOLDER = "—";

type PendingRangeFilter = {
  dimensionId: AnalysisRangeDimensionId | "";
  min: string;
  max: string;
};

const EMPTY_PENDING_FILTER: PendingRangeFilter = {
  dimensionId: "",
  min: "",
  max: "",
};

function unitWidthClass(unit: string | undefined): string {
  if (!unit) {
    return "";
  }

  return unit.length > 4 ? "analysis-dimension-input-with-unit--wide-unit" : "analysis-dimension-input-with-unit--with-unit";
}

function getRangeInputStep(dimensionId: AnalysisRangeDimensionId): string {
  switch (dimensionId) {
    case "bathrooms":
      return "0.5";
    case "distanceToCityCenter":
    case "schoolRating":
      return "0.1";
    default:
      return "1";
  }
}

function getRangeSummary(min: string, max: string, unit: string | undefined): string {
  const suffix = unit ? ` ${unit}` : "";

  if (min && max) {
    return `${min}${suffix} - ${max}${suffix}`;
  }

  if (min) {
    return `At least ${min}${suffix}`;
  }

  if (max) {
    return `Up to ${max}${suffix}`;
  }

  return "Any value";
}

type DimensionRangeInputProps = {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  unit?: string;
  integer?: boolean;
  step?: string;
  disabled: boolean;
  error?: string;
  onChange: (value: string) => void;
};

function DimensionRangeInput({
  id,
  label,
  value,
  placeholder,
  unit,
  integer = true,
  step = "1",
  disabled,
  error,
  onChange,
}: DimensionRangeInputProps) {
  const errorId = error ? `${id}-error` : undefined;
  const unitClass = unit ? unitWidthClass(unit) : "";
  const locked = disabled;

  return (
    <div className="valuation-filter-field valuation-filter-field-number">
      <label htmlFor={id} className="analysis-dimension-label">
        {label}
      </label>
      <span
        className={[
          "analysis-dimension-input-with-unit",
          unit ? unitClass : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <input
          id={id}
          type="number"
          className={[
            "valuation-filter-input",
            "analysis-dimension-range-input",
            "analysis-dimension-control",
            locked ? "analysis-dimension-range-input--locked" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          inputMode={integer ? "numeric" : "decimal"}
          step={step}
          min={0}
          value={value}
          placeholder={placeholder}
          readOnly={locked}
          aria-disabled={locked}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          title={locked ? placeholder : undefined}
          tabIndex={locked ? -1 : undefined}
          onChange={(event) => {
            if (locked) {
              return;
            }

            onChange(sanitizeRangeFilterInput(event.target.value, integer));
          }}
        />
        {unit ? (
          <span className="analysis-dimension-input-unit" aria-hidden="true">
            {unit}
          </span>
        ) : null}
      </span>
      {error ? (
        <span id={errorId} className="analysis-field-error">
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function AnalysisDimensionFilters({
  formId,
  draft,
  errors,
  onDraftChange,
}: AnalysisDimensionFiltersProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [pendingFilter, setPendingFilter] = useState<PendingRangeFilter>(EMPTY_PENDING_FILTER);
  const savedFilters = useMemo(
    () =>
      draft.dimensionRowSelections
        .map((dimensionId, rowIndex) => ({ dimensionId, rowIndex }))
        .filter(
          (item): item is { dimensionId: AnalysisRangeDimensionId; rowIndex: number } =>
            Boolean(item.dimensionId),
        ),
    [draft.dimensionRowSelections],
  );
  const usedDimensions = useMemo(
    () => new Set(savedFilters.map((filter) => filter.dimensionId)),
    [savedFilters],
  );
  const canCreateFilter = usedDimensions.size < ANALYSIS_FEATURE_DIMENSIONS.length;
  const pendingDimensionConfig = pendingFilter.dimensionId
    ? getDimensionConfig(pendingFilter.dimensionId)
    : null;
  const canSaveFilter =
    Boolean(pendingFilter.dimensionId) && Boolean(pendingFilter.min || pendingFilter.max);

  const handleRemoveRow = (rowIndex: number) => {
    onDraftChange(removeAnalysisDimensionRow(draft, rowIndex));
  };

  const handleCreateFilter = () => {
    setIsCreating(true);
    setPendingFilter(EMPTY_PENDING_FILTER);
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    setPendingFilter(EMPTY_PENDING_FILTER);
  };

  const handleSaveFilter = () => {
    if (!pendingFilter.dimensionId || usedDimensions.has(pendingFilter.dimensionId)) {
      return;
    }

    const emptyRowIndex = draft.dimensionRowSelections.findIndex((dimensionId) => !dimensionId);
    const baseDraft =
      emptyRowIndex >= 0 ? draft : addAnalysisDimensionRow(draft);
    const targetRowIndex =
      emptyRowIndex >= 0 ? emptyRowIndex : baseDraft.dimensionRowSelections.length - 1;
    const fields = RANGE_FIELDS[pendingFilter.dimensionId];
    const nextDraft = {
      ...changeAnalysisDimensionRow(baseDraft, targetRowIndex, pendingFilter.dimensionId),
      [fields.min]: pendingFilter.min,
      [fields.max]: pendingFilter.max,
    };

    onDraftChange(nextDraft);
    setPendingFilter(EMPTY_PENDING_FILTER);
    setIsCreating(false);
  };

  return (
    <fieldset className="analysis-dimension-filters">
      <legend className="sr-only">Data filters</legend>
      {!isCreating ? (
        <div className="analysis-dimension-editor-head">
          <button
            type="button"
            className="valuation-btn valuation-btn-primary analysis-dimension-add-btn"
            onClick={handleCreateFilter}
            disabled={!canCreateFilter}
          >
            <Plus aria-hidden size={16} />
            Create filter
          </button>
        </div>
      ) : null}

      {isCreating ? (
        <div className="analysis-dimension-create-card">
          <div className="analysis-dimension-create-grid">
            <div className="valuation-filter-field valuation-filter-field-text analysis-dimension-field-col">
              <label htmlFor={`${formId}-create-field`} className="analysis-dimension-label">
                Field
              </label>
              <Select
                value={pendingFilter.dimensionId || undefined}
                onValueChange={(value) =>
                  setPendingFilter((current) => ({
                    ...current,
                    dimensionId: value as AnalysisRangeDimensionId,
                  }))
                }
              >
                <SelectTrigger
                  id={`${formId}-create-field`}
                  className="portal-filter-select analysis-filter-select analysis-dimension-control hover:bg-[var(--portal-color-surface)] focus:bg-[var(--portal-color-surface)] data-[state=open]:bg-[var(--portal-color-surface)] focus-visible:ring-0"
                  aria-label="Filter field"
                >
                  <SelectValue placeholder={FIELD_SELECT_PLACEHOLDER} />
                </SelectTrigger>
                <SelectContent className="portal-filter-select-content analysis-filter-select-content analysis-dimension-select-content">
                  {ANALYSIS_FEATURE_DIMENSIONS.map((dimension) => (
                    <SelectItem
                      key={dimension.id}
                      value={dimension.id}
                      disabled={usedDimensions.has(dimension.id)}
                      title={`${dimension.fieldKey} (${dimension.label})`}
                      className="portal-filter-select-item analysis-filter-select-item"
                    >
                      {dimension.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="analysis-dimension-min-col">
              <DimensionRangeInput
                id={`${formId}-create-min`}
                label="Min"
                value={pendingFilter.min}
                placeholder={!pendingFilter.dimensionId ? RANGE_INPUT_DISABLED_PLACEHOLDER : "Min"}
                unit={pendingDimensionConfig?.unit}
                integer={pendingDimensionConfig ? pendingDimensionConfig.integer ?? false : true}
                step={
                  pendingFilter.dimensionId
                    ? getRangeInputStep(pendingFilter.dimensionId)
                    : "1"
                }
                disabled={!pendingFilter.dimensionId}
                onChange={(value) =>
                  setPendingFilter((current) => ({ ...current, min: value }))
                }
              />
            </div>

            <div className="analysis-dimension-max-col">
              <DimensionRangeInput
                id={`${formId}-create-max`}
                label="Max"
                value={pendingFilter.max}
                placeholder={!pendingFilter.dimensionId ? RANGE_INPUT_DISABLED_PLACEHOLDER : "Max"}
                unit={pendingDimensionConfig?.unit}
                integer={pendingDimensionConfig ? pendingDimensionConfig.integer ?? false : true}
                step={
                  pendingFilter.dimensionId
                    ? getRangeInputStep(pendingFilter.dimensionId)
                    : "1"
                }
                disabled={!pendingFilter.dimensionId}
                onChange={(value) =>
                  setPendingFilter((current) => ({ ...current, max: value }))
                }
              />
            </div>
          </div>

          <div className="analysis-dimension-create-actions">
            <button
              type="button"
              className="valuation-btn valuation-btn-primary"
              onClick={handleSaveFilter}
              disabled={!canSaveFilter}
            >
              Save filter
            </button>
            <button
              type="button"
              className="valuation-btn valuation-btn-secondary"
              onClick={handleCancelCreate}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <div className="analysis-dimension-saved-list" aria-live="polite">
        {savedFilters.length > 0 ? (
          savedFilters.map(({ dimensionId, rowIndex }) => {
            const fields = RANGE_FIELDS[dimensionId];
            const dimensionConfig = getDimensionConfig(dimensionId);
            const min = draft[fields.min] as string;
            const max = draft[fields.max] as string;
            const minError = errors[fields.min as keyof AnalysisFilterErrors];
            const maxError = errors[fields.max as keyof AnalysisFilterErrors];

            return (
              <div key={`${dimensionId}-${rowIndex}`} className="analysis-dimension-saved-card">
                <div className="analysis-dimension-saved-copy">
                  <span className="analysis-dimension-saved-label">{dimensionConfig.label}</span>
                  <span className="analysis-dimension-saved-range">
                    {getRangeSummary(min, max, dimensionConfig.unit)}
                  </span>
                  {minError || maxError ? (
                    <span className="analysis-field-error">
                      {minError || maxError}
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="analysis-icon-btn analysis-dimension-remove-btn"
                  aria-label={`Delete ${dimensionConfig.label} filter`}
                  onClick={() => handleRemoveRow(rowIndex)}
                >
                  <X aria-hidden size={18} />
                </button>
              </div>
            );
          })
        ) : (
          <div className="analysis-dimension-empty-state">
            No filters saved. Create a filter to narrow the analysis data.
          </div>
        )}
      </div>
    </fieldset>
  );
}
