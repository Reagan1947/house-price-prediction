"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { PortalHeader } from "@/app/components/portal/portal-header";
import { PREDICTION_HISTORY_UNAVAILABLE_MSG } from "@/lib/valuation/api-helpers";
import { ValuationApiError } from "@/lib/valuation/errors";
import { deletePrediction, getPredictions } from "@/lib/valuation/services";
import { normalizeTab } from "@/lib/valuation/mappers";
import type { PredictionRecord, ValuationTab } from "@/lib/valuation/types";
import { ValuationSidenav } from "./valuation-sidenav";
import { PredictionPage } from "./prediction-page";
import { HistoryPage } from "./history-page";
import { ComparisonPage } from "./comparison-page";
import { CreatePredictionDialog } from "./create-prediction-dialog";
import { ValuationConfirmDialog } from "./valuation-confirm-dialog";

type ValuationShellProps = {
  initialTab: ValuationTab;
  initialPredictionId?: string;
  initialRecords: PredictionRecord[];
  initialWarning?: string;
  currentUserName?: string;
};

type DialogState = {
  open: boolean;
  readOnly: boolean;
  heading: string;
  record: PredictionRecord | null;
};

const DEFAULT_ERROR = "Failed to load prediction records. Please retry.";

export function ValuationShell({
  initialTab,
  initialPredictionId,
  initialRecords,
  initialWarning,
  currentUserName,
}: ValuationShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [records, setRecords] = useState<PredictionRecord[]>(initialRecords);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(initialWarning ?? null);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const hasExplicitTab = searchParams.has("tab") || searchParams.has("mode") || searchParams.has("view");
  const resolvedTab = normalizeTab({
    tab: searchParams.get("tab"),
    mode: searchParams.get("mode"),
    view: searchParams.get("view"),
  });
  const currentTab: ValuationTab = initialPredictionId && !hasExplicitTab ? "history" : resolvedTab || initialTab;

  const [dialogState, setDialogState] = useState<DialogState>(() => {
    if (!initialPredictionId) {
      return {
        open: false,
        readOnly: false,
        heading: "Create New House Price Prediction",
        record: null,
      };
    }

    const target = initialRecords.find((record) => record.id === initialPredictionId) ?? null;

    if (!target) {
      return {
        open: false,
        readOnly: false,
        heading: "Create New House Price Prediction",
        record: null,
      };
    }

    return {
      open: true,
      readOnly: true,
      heading: `Prediction Detail - ${target.id}`,
      record: target,
    };
  });

  const syncUrl = (nextTab: ValuationTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("mode");
    params.delete("view");
    params.set("tab", nextTab);

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const reloadRecords = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getPredictions();
      const nextRecords = data.items;
      const nextRecordIds = new Set(nextRecords.map((record) => record.id));
      setRecords(nextRecords);
      setSelectedForComparison((current) => current.filter((recordId) => nextRecordIds.has(recordId)));
      setWarning(data.historyUnavailable ? PREDICTION_HISTORY_UNAVAILABLE_MSG : null);
    } catch (loadError) {
      setError(loadError instanceof ValuationApiError ? loadError.message : DEFAULT_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  const requestDelete = (id: string) => {
    setDeleteTargetId(id);
  };

  const handleCancelDelete = () => {
    setDeleteTargetId(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) {
      return;
    }

    const targetId = deleteTargetId;
    setDeleteTargetId(null);

    setIsLoading(true);
    setError(null);

    try {
      await deletePrediction(targetId);
      await reloadRecords();
      setSelectedForComparison((current) => current.filter((item) => item !== targetId));
    } catch {
      setError("Failed to delete prediction. Please retry.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCompare = (id: string) => {
    setSelectedForComparison((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }

      const target = records.find((record) => record.id === id);
      if (!target || target.predictedPrice === null) {
        return current;
      }

      return [...current, id];
    });
  };

  const handleSetCompareSelection = (ids: string[]) => {
    setSelectedForComparison(Array.from(new Set(ids)));
  };

  const handleRemoveCompareSelection = (id: string) => {
    setSelectedForComparison((current) => current.filter((item) => item !== id));
  };

  const openDialogCreate = () => {
    setDialogState({
      open: true,
      readOnly: false,
      heading: "Create New House Price Prediction",
      record: null,
    });
  };

  const openDialogView = (id: string) => {
    const target = records.find((record) => record.id === id);
    if (!target) {
      return;
    }

    setDialogState({
      open: true,
      readOnly: true,
      heading: `Prediction Detail - ${target.id}`,
      record: target,
    });
  };

  const openDialogReuse = (id: string) => {
    const target = records.find((record) => record.id === id);
    if (!target) {
      return;
    }

    setDialogState({
      open: true,
      readOnly: false,
      heading: `Reuse Prediction Template - ${target.id}`,
      record: {
        ...target,
        id: "",
      },
    });
  };

  const highlightedPredictionId = initialPredictionId;
  const dialogKey = `${dialogState.heading}:${dialogState.readOnly ? "readonly" : "editable"}:${dialogState.record?.id ?? "new"}`;
  const deleteTarget = deleteTargetId ? (records.find((record) => record.id === deleteTargetId) ?? null) : null;

  return (
    <div className="portal-page valuation-page">
      <PortalHeader userName={currentUserName} />

      <div className="portal-shell valuation-shell">
        <ValuationSidenav
          currentTab={currentTab}
          onTabChange={syncUrl}
        />

        <main id="main-content" tabIndex={-1} className="portal-main-content valuation-main-content">
          <div className="portal-main-content-inner valuation-main-content-inner">
            {warning ? (
              <div className="valuation-feedback valuation-feedback-warning" role="status">
                <p>{warning}</p>
              </div>
            ) : null}

            {error ? (
              <div className="valuation-feedback valuation-feedback-danger" role="alert">
                <p>{error}</p>
                <button type="button" className="valuation-inline-btn" onClick={() => void reloadRecords()}>
                  <RefreshCw aria-hidden size={14} />
                  Retry
                </button>
              </div>
            ) : null}

            {currentTab === "prediction" ? (
              <PredictionPage
                records={records}
                isLoading={isLoading}
                highlightPredictionId={highlightedPredictionId}
                selectedForComparison={selectedForComparison}
                onCreate={openDialogCreate}
                onDelete={requestDelete}
                onView={openDialogView}
                onReuse={openDialogReuse}
                onToggleCompare={handleToggleCompare}
              />
            ) : null}

            {currentTab === "history" ? (
              <HistoryPage
                records={records}
                isLoading={isLoading}
                highlightPredictionId={highlightedPredictionId}
                selectedForComparison={selectedForComparison}
                onDelete={requestDelete}
                onView={openDialogView}
                onReuse={openDialogReuse}
                onToggleCompare={handleToggleCompare}
              />
            ) : null}

            {currentTab === "comparison" ? (
              <ComparisonPage
                records={records}
                isLoading={isLoading}
                selectedRecordIds={selectedForComparison}
                onSetSelection={handleSetCompareSelection}
                onRemoveSelection={handleRemoveCompareSelection}
                onClearSelection={() => setSelectedForComparison([])}
                onCreatePrediction={openDialogCreate}
              />
            ) : null}
          </div>
        </main>
      </div>

      <CreatePredictionDialog
        key={dialogKey}
        open={dialogState.open}
        heading={dialogState.heading}
        readOnly={dialogState.readOnly}
        defaultRecord={dialogState.record}
        onClose={() => {
          setDialogState((current) => ({ ...current, open: false }));
        }}
        onSaved={() => {
          setDialogState((current) => ({
            ...current,
            open: false,
            record: null,
          }));
          void reloadRecords();
          syncUrl("prediction");
        }}
      />

      <ValuationConfirmDialog
        open={deleteTargetId !== null}
        title="Delete this prediction?"
        message={`Prediction "${deleteTarget?.title ?? deleteTargetId ?? ""}" will be permanently deleted. This action cannot be undone.`}
        cancelLabel="Cancel"
        confirmLabel="Delete"
        onConfirm={() => {
          void handleConfirmDelete();
        }}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
