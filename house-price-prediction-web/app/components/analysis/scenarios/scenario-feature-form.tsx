"use client";

import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { FEATURE_FIELDS } from "@/app/components/valuation/constants";
import {
  formatScenarioRangeLabel,
  SCENARIO_FIELD_LIMITS,
  validateScenarioFeatures,
} from "@/lib/analysis/scenarios";
import type { ValuationFeatureInput } from "@/lib/valuation/types";
import { cn } from "@/lib/utils";

type ScenarioFeatureFormProps = {
  features: ValuationFeatureInput;
  disabled?: boolean;
  onChange: (features: ValuationFeatureInput) => void;
  onReset: () => void;
  onRun: () => void;
};

function unitWidthClass(unit: string): string {
  return unit.length > 4
    ? "analysis-scenario-input-with-unit--wide-unit"
    : "analysis-scenario-input-with-unit--with-unit";
}

export function ScenarioFeatureForm({ features, disabled, onChange, onReset, onRun }: ScenarioFeatureFormProps) {
  const errors = validateScenarioFeatures(features);
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <form
      className="analysis-scenario-form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (!hasErrors) {
          onRun();
        }
      }}
    >
      {FEATURE_FIELDS.map((field) => {
        const key = field.key;
        const limits = SCENARIO_FIELD_LIMITS[key];
        const unit = field.unit;
        const error = errors[key];
        const fieldId = `scenario-${key}`;
        const sliderId = `${fieldId}-slider`;
        const value = features[key];

        return (
          <div key={key} className="analysis-scenario-field">
            <label id={`${fieldId}-label`} htmlFor={fieldId}>
              {field.label}
            </label>
            <div className="analysis-scenario-controls">
              <div className="analysis-scenario-slider-wrap">
                <Slider
                  id={sliderId}
                  className="analysis-scenario-slider"
                  min={limits.min}
                  max={limits.max}
                  step={limits.step}
                  value={[value]}
                  disabled={disabled}
                  aria-labelledby={`${fieldId}-label`}
                  aria-valuetext={`${value} ${unit}`}
                  aria-invalid={Boolean(error)}
                  onValueChange={(nextValue) =>
                    onChange({ ...features, [key]: nextValue[0] ?? limits.min })
                  }
                />
                <div className="analysis-scenario-slider-range" aria-hidden="true">
                  <span>{formatScenarioRangeLabel(key, limits.min)}</span>
                  <span>{formatScenarioRangeLabel(key, limits.max)}</span>
                </div>
              </div>
              <span
                className={cn(
                  "analysis-scenario-input-with-unit",
                  unitWidthClass(unit),
                )}
              >
                <Input
                  id={fieldId}
                  type="number"
                  className="analysis-scenario-number-input rounded-none"
                  inputMode="decimal"
                  value={value}
                  disabled={disabled}
                  aria-invalid={Boolean(error)}
                  aria-describedby={`${fieldId}-unit`}
                  aria-labelledby={`${fieldId}-label`}
                  onChange={(event) => {
                    const parsed = Number(event.target.value);
                    onChange({
                      ...features,
                      [key]: Number.isFinite(parsed) ? parsed : features[key],
                    });
                  }}
                />
                <span id={`${fieldId}-unit`} className="analysis-scenario-input-unit">
                  {unit}
                </span>
              </span>
            </div>
            {error ? <span className="analysis-field-error">{error}</span> : null}
          </div>
        );
      })}

      <div className="analysis-scenario-actions">
        <button
          type="submit"
          className="valuation-btn valuation-btn-primary"
          disabled={disabled || hasErrors}
        >
          Run Scenario
        </button>
        <button type="button" className="valuation-btn valuation-btn-secondary" onClick={onReset} disabled={disabled}>
          Reset to Baseline
        </button>
      </div>
    </form>
  );
}
