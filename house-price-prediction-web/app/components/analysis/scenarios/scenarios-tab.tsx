"use client";

import { useState } from "react";
import { ComparisonSelectionDialog } from "@/app/components/valuation/comparison-selection-dialog";
import type { ScenarioBaseline, ScenarioResult } from "@/lib/analysis/types";
import type { PredictionRecord, ValuationFeatureInput } from "@/lib/valuation/types";
import { ScenarioFeatureForm } from "./scenario-feature-form";
import { ScenarioResultPanel } from "./scenario-result-panel";

type ScenariosTabProps = {
  records: PredictionRecord[];
  baseline: ScenarioBaseline | null;
  baselineLoading: boolean;
  baselineError: string | null;
  features: ValuationFeatureInput;
  result: ScenarioResult | null;
  scenarioLoading: boolean;
  scenarioError: string | null;
  formDisabled: boolean;
  onFeaturesChange: (features: ValuationFeatureInput) => void;
  onSeedFromRecord: (features: ValuationFeatureInput, recordId: string) => void;
  onRefreshBaseline: () => void;
  onRetryBaseline: () => void;
  onRun: () => void;
  onRetryScenario: () => void;
};

export function ScenariosTab({
  records,
  baseline,
  baselineLoading,
  baselineError,
  features,
  result,
  scenarioLoading,
  scenarioError,
  formDisabled,
  onFeaturesChange,
  onSeedFromRecord,
  onRefreshBaseline,
  onRetryBaseline,
  onRun,
  onRetryScenario,
}: ScenariosTabProps) {
  const [selectionOpen, setSelectionOpen] = useState(false);

  const selectableRecords = records.filter((record) => record.predictedPrice !== null);

  const handleRecordSeed = (recordIds: string[]) => {
    const record = selectableRecords.find((item) => item.id === recordIds[0]);
    if (!record) {
      return;
    }

    onSeedFromRecord({ ...record.features }, record.id);
    setSelectionOpen(false);
  };

  return (
    <section className="analysis-scenarios-tab" aria-label="What-if scenarios">
      <section className="analysis-scenarios-panel" aria-labelledby="analysis-scenarios-panel-title">
        <header className="analysis-scenarios-panel-head">
          <div className="analysis-panel-heading">
            <h2 id="analysis-scenarios-panel-title" className="analysis-scenarios-panel-title">
              Scenarios
            </h2>
            <p className="analysis-panel-description">
              Use median features from your current filters as a baseline, adjust property inputs, and
              compare predicted prices.
            </p>
          </div>
          <div className="analysis-scenarios-panel-actions">
            <button
              type="button"
              className="valuation-btn valuation-btn-secondary"
              onClick={onRefreshBaseline}
              disabled={baselineLoading}
            >
              Refresh baseline
            </button>
            <button
              type="button"
              className="valuation-btn valuation-btn-secondary"
              onClick={() => setSelectionOpen(true)}
              disabled={!baseline || baselineLoading || selectableRecords.length === 0}
            >
              Start from a record
            </button>
          </div>
        </header>

        <div className="analysis-scenarios-panel-body">
          {baselineLoading ? (
            <p className="analysis-scenario-status" role="status" aria-live="polite">
              Loading baseline...
            </p>
          ) : null}

          {!baselineLoading && baselineError ? (
            <div className="valuation-feedback valuation-feedback-danger" role="alert">
              <p>{baselineError}</p>
              <button type="button" className="valuation-inline-btn" onClick={onRetryBaseline}>
                Retry
              </button>
            </div>
          ) : null}

          <ScenarioFeatureForm
            features={features}
            disabled={formDisabled}
            onChange={onFeaturesChange}
            onReset={() => {
              if (baseline) {
                onFeaturesChange({ ...baseline.features });
              }
            }}
            onRun={onRun}
          />

          <ScenarioResultPanel
            result={result}
            loading={scenarioLoading}
            error={scenarioError}
            onRetry={onRetryScenario}
          />
        </div>
      </section>

      {selectionOpen ? (
        <ComparisonSelectionDialog
          open={selectionOpen}
          records={selectableRecords}
          selectedRecordIds={[]}
          onConfirm={(recordIds) => handleRecordSeed(recordIds.slice(0, 1))}
          onClose={() => setSelectionOpen(false)}
        />
      ) : null}
    </section>
  );
}
