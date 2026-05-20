"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PortalHeader } from "@/app/components/portal/portal-header";
import {
  downloadAnalysisTableCsv,
  downloadAnalysisTableExcel,
} from "@/lib/analysis/exporters/table";
import {
  mergeAnalysisFilters,
  parseAnalysisSearchParams,
  serializeAnalysisFilters,
} from "@/lib/analysis/filters";
import {
  fetchWhatIfBaseline,
  getAnalysisRecords,
  getAnalysisSegments,
  getFilteredAnalysisRecords,
  runScenario,
} from "@/lib/analysis/services";
import type {
  AnalysisChartClickPayload,
  AnalysisFilterInput,
  AnalysisRecordsResult,
  AnalysisSegmentGroupKey,
  AnalysisSegmentRow,
  AnalysisSegmentsResult,
  AnalysisTab,
  ScenarioBaseline,
  ScenarioResult,
} from "@/lib/analysis/types";
import { ValuationApiError } from "@/lib/valuation/errors";
import type { PredictionRecord, ValuationFeatureInput } from "@/lib/valuation/types";
import { AnalysisFilterBar } from "./analysis-filter-bar";
import { AnalysisPageHeader } from "./analysis-page-header";
import { AnalysisSidenav } from "./analysis-sidenav";
import { DashboardTab } from "./dashboard/dashboard-tab";
import { DataTableTab } from "./data/data-table-tab";
import type { SortField } from "./data/analysis-data-table";
import { ScenariosTab } from "./scenarios/scenarios-tab";
import { SegmentsTab } from "./segments/segments-tab";

type AnalysisShellProps = {
  initialRecords: PredictionRecord[];
  initialWarning?: string;
  currentUserName?: string;
};

const DEFAULT_SCENARIO_FEATURES: ValuationFeatureInput = {
  squareFootage: 1500,
  bedrooms: 3,
  bathrooms: 2,
  yearBuilt: 1990,
  lotSize: 5000,
  distanceToCityCenter: 5,
  schoolRating: 7,
};

export function AnalysisShell({
  initialRecords,
  initialWarning,
  currentUserName,
}: AnalysisShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mainRef = useRef<HTMLElement | null>(null);

  const parsed = useMemo(() => parseAnalysisSearchParams(searchParams), [searchParams]);
  const currentTab = parsed.tab;
  const filters = parsed.filters;
  const segmentGroupBy = parsed.segmentDimension ?? "bedrooms";
  const filtersSnapshot = useMemo(() => serializeAnalysisFilters(filters).toString(), [filters]);

  const [records] = useState(initialRecords);
  const [warning] = useState<string | null>(initialWarning ?? null);
  const filterNotice = parsed.ignored ? "Some filters were ignored." : null;

  const [tableResult, setTableResult] = useState<AnalysisRecordsResult | null>(null);
  const [tableLoading, setTableLoading] = useState(true);
  const [tableError, setTableError] = useState<string | null>(null);

  const [segments, setSegments] = useState<AnalysisSegmentsResult | null>(null);
  const [segmentsLoading, setSegmentsLoading] = useState(false);
  const [segmentsError, setSegmentsError] = useState<string | null>(null);

  const [baseline, setBaseline] = useState<ScenarioBaseline | null>(null);
  const [baselineLoading, setBaselineLoading] = useState(false);
  const [baselineError, setBaselineError] = useState<string | null>(null);
  const [scenarioSeedRecordId, setScenarioSeedRecordId] = useState<string | undefined>();
  const [scenarioFeatures, setScenarioFeatures] = useState<ValuationFeatureInput>(DEFAULT_SCENARIO_FEATURES);
  const [scenarioResult, setScenarioResult] = useState<ScenarioResult | null>(null);
  const [scenarioLoading, setScenarioLoading] = useState(false);
  const [scenarioError, setScenarioError] = useState<string | null>(null);

  const featuresDirtyRef = useRef(false);
  const baselineRequestIdRef = useRef(0);
  const lastBaselineFiltersRef = useRef("");

  const [drawerRecord, setDrawerRecord] = useState<PredictionRecord | null>(null);
  const [, setCompareIds] = useState<string[]>([]);
  const [exportBusy, setExportBusy] = useState(false);
  const [toast, setToast] = useState<{ type: "status" | "alert"; message: string } | null>(null);

  const replaceUrl = useCallback(
    (
      nextFilters: AnalysisFilterInput,
      nextTab: AnalysisTab = currentTab,
      nextSegmentGroupBy: AnalysisSegmentGroupKey = segmentGroupBy,
    ) => {
      const params = serializeAnalysisFilters(nextFilters, {
        tab: nextTab,
        segmentDimension: nextTab === "segments" ? nextSegmentGroupBy : undefined,
      });
      router.replace(`${pathname}?${params.toString()}`);
    },
    [currentTab, pathname, router, segmentGroupBy],
  );

  const loadBaseline = useCallback(
    async (options?: { seedRecordId?: string; filtersChanged?: boolean }) => {
      const requestId = ++baselineRequestIdRef.current;
      setBaselineLoading(true);
      setBaselineError(null);

      const seedId = options?.filtersChanged ? undefined : options?.seedRecordId ?? scenarioSeedRecordId;

      try {
        const data = await fetchWhatIfBaseline(filters, seedId);

        if (requestId !== baselineRequestIdRef.current) {
          return;
        }

        setBaseline(data);

        if (!featuresDirtyRef.current) {
          setScenarioFeatures({ ...data.features });
        }

        setScenarioResult(null);
      } catch (error) {
        if (requestId !== baselineRequestIdRef.current) {
          return;
        }

        setBaseline(null);
        setBaselineError(
          error instanceof ValuationApiError ? error.message : "Failed to load baseline.",
        );
      } finally {
        if (requestId === baselineRequestIdRef.current) {
          setBaselineLoading(false);
        }
      }
    },
    [filters, scenarioSeedRecordId],
  );

  const loadTable = useCallback(async () => {
    setTableLoading(true);
    setTableError(null);

    try {
      const data = await getAnalysisRecords({
        sort: "predictedPrice",
        order: "desc",
        size: 20,
        ...filters,
      });
      setTableResult(data);
    } catch (error) {
      setTableError(error instanceof ValuationApiError ? error.message : "Failed to load table data.");
    } finally {
      setTableLoading(false);
    }
  }, [filters]);

  const loadSegments = useCallback(async () => {
    setSegmentsLoading(true);
    setSegmentsError(null);
    setSegments(null);

    try {
      const data = await getAnalysisSegments(filters, segmentGroupBy);
      setSegments(data);
    } catch (error) {
      setSegments(null);
      setSegmentsError(error instanceof ValuationApiError ? error.message : "Failed to load segment data.");
    } finally {
      setSegmentsLoading(false);
    }
  }, [filters, segmentGroupBy]);

  useEffect(() => {
    if (currentTab !== "data") {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch table when tab/filters change
    void loadTable();
  }, [currentTab, loadTable]);

  useEffect(() => {
    if (currentTab !== "segments") {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch segments when tab/filters/group change
    void loadSegments();
  }, [currentTab, loadSegments]);

  useEffect(() => {
    if (currentTab !== "scenarios") {
      return;
    }

    const filtersChanged =
      lastBaselineFiltersRef.current !== "" && lastBaselineFiltersRef.current !== filtersSnapshot;

    lastBaselineFiltersRef.current = filtersSnapshot;

    if (filtersChanged) {
      featuresDirtyRef.current = false;
      setScenarioSeedRecordId(undefined);
    }

    void loadBaseline({
      filtersChanged,
      seedRecordId: filtersChanged ? undefined : scenarioSeedRecordId,
    });
  }, [currentTab, filtersSnapshot, loadBaseline, scenarioSeedRecordId]);

  const handleTabChange = (tab: AnalysisTab) => {
    replaceUrl(filters, tab, segmentGroupBy);
    mainRef.current?.focus();
  };

  const handleSegmentGroupByChange = (groupBy: AnalysisSegmentGroupKey) => {
    replaceUrl(filters, "segments", groupBy);
  };

  const handleApplyFilters = (nextFilters: AnalysisFilterInput) => {
    replaceUrl(nextFilters, currentTab);
  };

  const handleChartFilter = (payload: AnalysisChartClickPayload) => {
    if (payload.type === "priceRange") {
      replaceUrl(
        mergeAnalysisFilters(filters, {
          priceMin: payload.priceMin,
          priceMax: payload.priceMax,
          page: 1,
        }),
        "dashboard",
      );
      return;
    }

    if (payload.type === "yearBuilt") {
      replaceUrl(
        mergeAnalysisFilters(filters, {
          yearBuiltMin: payload.yearBuiltMin,
          yearBuiltMax: payload.yearBuiltMax,
          page: 1,
        }),
        "dashboard",
      );
      return;
    }

    replaceUrl(
      mergeAnalysisFilters(filters, {
        highlightId: payload.recordId,
        page: 1,
      }),
      "data",
    );
  };

  const handleSegmentDrillDown = (row: AnalysisSegmentRow) => {
    replaceUrl(
      mergeAnalysisFilters(filters, {
        ...row.filterPatch,
        page: 1,
        highlightId: undefined,
      }),
      "dashboard",
    );
  };

  const handleSort = (field: SortField) => {
    const isSame = filters.sort === field;
    const order = isSame && filters.order === "desc" ? "asc" : "desc";
    replaceUrl(mergeAnalysisFilters(filters, { sort: field, order, page: 1 }), currentTab);
  };

  const handleRunScenario = async () => {
    if (!baseline) {
      return;
    }

    setScenarioLoading(true);
    setScenarioError(null);

    try {
      const result = await runScenario(baseline, scenarioFeatures);
      setScenarioResult(result);
    } catch (error) {
      setScenarioError(error instanceof ValuationApiError ? error.message : "Failed to run scenario.");
    } finally {
      setScenarioLoading(false);
    }
  };

  const handleExportDataTable = async (format: "csv" | "excel") => {
    setExportBusy(true);
    try {
      const rows = await getFilteredAnalysisRecords(filters);
      const outcome =
        format === "csv" ? downloadAnalysisTableCsv(rows) : downloadAnalysisTableExcel(rows);

      if (!outcome.ok) {
        setToast({ type: "alert", message: outcome.message });
      } else {
        setToast({ type: "status", message: "Data table export ready." });
      }
    } catch {
      setToast({ type: "alert", message: "Data table export failed." });
    } finally {
      setExportBusy(false);
    }
  };

  const handleUseBaseline = (record: PredictionRecord) => {
    featuresDirtyRef.current = true;
    setScenarioSeedRecordId(record.id);
    setScenarioFeatures({ ...record.features });
    setScenarioResult(null);
    setDrawerRecord(null);
    replaceUrl(filters, "scenarios");
  };

  const handleScenarioFeaturesChange = (features: ValuationFeatureInput) => {
    featuresDirtyRef.current = true;
    setScenarioFeatures(features);
  };

  const handleSeedFromRecord = (features: ValuationFeatureInput, recordId: string) => {
    featuresDirtyRef.current = true;
    setScenarioSeedRecordId(recordId);
    setScenarioFeatures(features);
    setScenarioResult(null);
    setBaseline((current) =>
      current ? { ...current, scenarioSeedRecordId: recordId } : current,
    );
  };

  const handleAddCompare = (record: PredictionRecord) => {
    setCompareIds((current) => (current.includes(record.id) ? current : [...current, record.id]));
    setToast({ type: "status", message: `Added ${record.id} to compare list (local).` });
  };

  const scenarioFormDisabled = !baseline || baselineLoading || scenarioLoading;

  return (
    <div className="portal-page analysis-page">
      <PortalHeader userName={currentUserName} />

      <div className="portal-shell analysis-shell">
        <AnalysisSidenav currentTab={currentTab} onTabChange={handleTabChange} />

        <main id="main-content" ref={mainRef} tabIndex={-1} className="portal-main-content analysis-main-content">
          <div className="portal-main-content-inner analysis-main-content-inner">
            {warning ? (
              <div className="valuation-feedback valuation-feedback-warning" role="status">
                <p>{warning}</p>
              </div>
            ) : null}

            {filterNotice ? (
              <div className="valuation-feedback valuation-feedback-warning" role="status">
                <p>{filterNotice}</p>
              </div>
            ) : null}

            {toast ? (
              <div
                className={`valuation-feedback ${toast.type === "alert" ? "valuation-feedback-danger" : "valuation-feedback-warning"}`}
                role={toast.type}
              >
                <p>{toast.message}</p>
              </div>
            ) : null}

            <AnalysisPageHeader currentTab={currentTab} />

            <AnalysisFilterBar filters={filters} onApply={handleApplyFilters} />

            {currentTab === "data" ? (
              <DataTableTab
                result={tableResult}
                filters={filters}
                loading={tableLoading}
                error={tableError}
                drawerRecord={drawerRecord}
                onSort={handleSort}
                onPageChange={(page) => replaceUrl(mergeAnalysisFilters(filters, { page }), currentTab)}
                onSizeChange={(size) =>
                  replaceUrl(mergeAnalysisFilters(filters, { size, page: 1 }), currentTab)
                }
                onRetry={() => void loadTable()}
                onRowClick={setDrawerRecord}
                onDrawerClose={() => setDrawerRecord(null)}
                onUseBaseline={handleUseBaseline}
                onAddCompare={handleAddCompare}
                exportBusy={exportBusy}
                onExportCsv={() => void handleExportDataTable("csv")}
                onExportExcel={() => void handleExportDataTable("excel")}
              />
            ) : null}

            {currentTab === "dashboard" ? (
              <DashboardTab filters={filters} onChartFilter={handleChartFilter} />
            ) : null}

            {currentTab === "segments" ? (
              <SegmentsTab
                result={segments}
                groupBy={segmentGroupBy}
                loading={segmentsLoading}
                error={segmentsError}
                onGroupByChange={handleSegmentGroupByChange}
                onRetry={() => void loadSegments()}
                onDrillDown={handleSegmentDrillDown}
              />
            ) : null}

            {currentTab === "scenarios" ? (
              <ScenariosTab
                records={records}
                baseline={baseline}
                baselineLoading={baselineLoading}
                baselineError={baselineError}
                features={scenarioFeatures}
                result={scenarioResult}
                scenarioLoading={scenarioLoading}
                scenarioError={scenarioError}
                formDisabled={scenarioFormDisabled}
                onFeaturesChange={handleScenarioFeaturesChange}
                onSeedFromRecord={handleSeedFromRecord}
                onRefreshBaseline={() => void loadBaseline()}
                onRetryBaseline={() => void loadBaseline()}
                onRun={() => void handleRunScenario()}
                onRetryScenario={() => void handleRunScenario()}
              />
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
