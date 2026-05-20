"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { EChartsOption } from "echarts";
import { formatUsd } from "@/lib/analysis/format";
import {
  DASHBOARD_CHART_COLOR_SERIES,
  getDashboardBarSeriesStyle,
  getDashboardCategoryXAxis,
  getDashboardCountAxis,
  getDashboardGrid,
  getDashboardLegend,
  getDashboardLineSeriesStyle,
  getDashboardPriceAxis,
  getDashboardScatterSeriesStyle,
  getDashboardSquareFootageXAxis,
  getDashboardTooltip,
} from "./dashboard-chart-theme";
import { hasAnalysisDashboardFilters } from "@/lib/analysis/dashboard-api";
import { getAnalysisDashboard } from "@/lib/analysis/services";
import type {
  AnalysisChartClickPayload,
  AnalysisCharts,
  AnalysisDashboardData,
  AnalysisFilterInput,
  AnalysisScatterPoint,
  AnalysisYearBucket,
} from "@/lib/analysis/types";
import { ValuationApiError } from "@/lib/valuation/errors";
import { AnalysisEChart } from "../shared/analysis-echart";
import { ChartCard } from "./chart-card";
import { KpiCard } from "./kpi-card";

type DashboardTabProps = {
  filters: AnalysisFilterInput;
  onChartFilter: (payload: AnalysisChartClickPayload) => void;
};

export function DashboardTab({ filters, onChartFilter }: DashboardTabProps) {
  const [data, setData] = useState<AnalysisDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const next = await getAnalysisDashboard(filters);
      setData(next);
    } catch (loadError) {
      setData(null);
      setError(
        loadError instanceof ValuationApiError ? loadError.message : "Failed to load dashboard data.",
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reload dashboard when filters change
    void loadDashboard();
  }, [loadDashboard]);

  const kpis = data?.kpis;
  const charts = data?.charts;
  const showBaselineDelta = useMemo(() => hasAnalysisDashboardFilters(filters), [filters]);

  return (
    <section className="analysis-dashboard-tab" aria-label="Market analysis dashboard">
      {data?.performanceWarning ? (
        <div className="valuation-feedback valuation-feedback-warning" role="status">
          <p>{data.performanceWarning}</p>
        </div>
      ) : null}

      {error ? (
        <div className="valuation-feedback valuation-feedback-danger" role="alert">
          <p>{error}</p>
          <button type="button" className="valuation-inline-btn" onClick={() => void loadDashboard()}>
            Retry
          </button>
        </div>
      ) : null}

      <div className="analysis-kpi-strip" role="group" aria-label="Key performance indicators">
        <KpiCard
          label="Total Records"
          value={kpis?.totalRecords ?? 0}
          format="count"
          loading={loading}
          error={error}
          onRetry={() => void loadDashboard()}
        />
        <KpiCard
          label="Avg Price"
          value={kpis?.avgPredictedPrice ?? 0}
          format="usd"
          delta={showBaselineDelta ? kpis?.deltaVsBaseline?.avgPredictedPrice : undefined}
          loading={loading}
          error={error}
          onRetry={() => void loadDashboard()}
        />
        <KpiCard
          label="Median Price"
          value={kpis?.medianPredictedPrice ?? 0}
          format="usd"
          delta={showBaselineDelta ? kpis?.deltaVsBaseline?.medianPredictedPrice : undefined}
          loading={loading}
          error={error}
          onRetry={() => void loadDashboard()}
        />
        <KpiCard
          label="Avg Price per Sq.Ft."
          value={kpis?.avgPricePerSquareFoot ?? 0}
          format="usdPerSqFt"
          delta={showBaselineDelta ? kpis?.deltaVsBaseline?.avgPricePerSquareFoot : undefined}
          loading={loading}
          error={error}
          onRetry={() => void loadDashboard()}
        />
      </div>

      <div className="analysis-chart-grid">
        <PriceDistributionChart
          buckets={charts?.priceDistribution ?? []}
          loading={loading}
          error={error}
          onRetry={() => void loadDashboard()}
          onFilter={onChartFilter}
        />
        <PriceScatterChart
          points={charts?.priceVsSquareFootage ?? []}
          loading={loading}
          error={error}
          onRetry={() => void loadDashboard()}
          onFilter={onChartFilter}
        />
        <YearBuiltTrendChart
          buckets={charts?.yearBuiltTrend ?? []}
          loading={loading}
          error={error}
          onRetry={() => void loadDashboard()}
          onFilter={onChartFilter}
        />
      </div>
    </section>
  );
}

function PriceDistributionChart({
  buckets,
  loading,
  error,
  onRetry,
  onFilter,
}: {
  buckets: AnalysisCharts["priceDistribution"];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onFilter: (payload: AnalysisChartClickPayload) => void;
}) {
  const option = useMemo<EChartsOption>(
    () => ({
      color: [...DASHBOARD_CHART_COLOR_SERIES],
      tooltip: getDashboardTooltip("axis"),
      legend: getDashboardLegend(),
      grid: getDashboardGrid({ bottom: 52 }),
      xAxis: getDashboardCategoryXAxis(
        "Price range",
        buckets.map((bucket) => bucket.label),
        { rotate: buckets.length > 8 },
      ),
      yAxis: getDashboardCountAxis("left"),
      series: [
        {
          name: "Count",
          type: "bar",
          data: buckets.map((bucket) => bucket.count),
          ...getDashboardBarSeriesStyle(),
        },
      ],
    }),
    [buckets],
  );

  return (
    <ChartCard
      title="Price Distribution"
      description="Histogram of actual sale prices in the current segment."
      empty={!loading && !error && buckets.length === 0}
      error={error}
      onRetry={onRetry}
    >
      {loading || error || buckets.length === 0 ? null : (
        <AnalysisEChart
          className="analysis-chart-canvas"
          option={option}
          ariaLabel="Price distribution histogram"
          onClick={(event) => {
            const index = event.dataIndex ?? 0;
            const bucket = buckets[index];
            if (!bucket) {
              return;
            }

            onFilter({
              type: "priceRange",
              priceMin: bucket.rangeStart,
              priceMax: bucket.rangeEnd,
            });
          }}
        />
      )}
    </ChartCard>
  );
}

function getScatterPointPrice(point: AnalysisScatterPoint): number {
  const price = point.price ?? point.predictedPrice;
  return typeof price === "number" && Number.isFinite(price) ? price : 0;
}

function PriceScatterChart({
  points,
  loading,
  error,
  onRetry,
  onFilter,
}: {
  points: AnalysisCharts["priceVsSquareFootage"];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onFilter: (payload: AnalysisChartClickPayload) => void;
}) {
  const scatterSeriesData = useMemo(
    () =>
      points
        .map((point) => {
          const squareFootage = Number(point.squareFootage);
          const price = getScatterPointPrice(point);
          if (!Number.isFinite(squareFootage) || squareFootage <= 0 || price <= 0) {
            return null;
          }

          return {
            value: [squareFootage, price] as [number, number],
            name: point.title,
            recordId: point.recordId,
          };
        })
        .filter((point): point is NonNullable<typeof point> => point !== null),
    [points],
  );

  const option = useMemo<EChartsOption>(() => {
    const squareFootages = scatterSeriesData.map((point) => point.value[0]);
    const prices = scatterSeriesData.map((point) => point.value[1]);
    const sqftMin = squareFootages.length > 0 ? Math.min(...squareFootages) : 0;
    const sqftMax = squareFootages.length > 0 ? Math.max(...squareFootages) : 0;
    const priceMin = prices.length > 0 ? Math.min(...prices) : 0;
    const priceMax = prices.length > 0 ? Math.max(...prices) : 0;
    const sqftPadding = Math.max((sqftMax - sqftMin) * 0.08, 50);
    const pricePadding = Math.max((priceMax - priceMin) * 0.08, 5_000);

    return {
      color: [...DASHBOARD_CHART_COLOR_SERIES],
      tooltip: {
        ...getDashboardTooltip("item"),
        formatter: (params) => {
          const item = Array.isArray(params) ? params[0] : params;
          const value = item?.value;
          if (!Array.isArray(value) || value.length < 2) {
            return "";
          }

          const [squareFootage, price] = value as [number, number];
          return `${item?.name ?? "Property"}<br/>${squareFootage} sq.ft · ${formatUsd(price)}`;
        },
      },
      legend: getDashboardLegend(),
      grid: getDashboardGrid({ left: 64, bottom: 52 }),
      xAxis: getDashboardSquareFootageXAxis(
        Math.max(0, Math.floor(sqftMin - sqftPadding)),
        Math.ceil(sqftMax + sqftPadding),
      ),
      yAxis: getDashboardPriceAxis(
        "left",
        {
          min: Math.max(0, Math.floor(priceMin - pricePadding)),
          max: Math.ceil(priceMax + pricePadding),
        },
        "Sale price",
      ),
      series: [
        {
          name: "Sale price",
          type: "scatter",
          symbolSize: 10,
          data: scatterSeriesData,
          ...getDashboardScatterSeriesStyle(),
        },
      ],
    };
  }, [scatterSeriesData]);

  return (
    <ChartCard
      title="Price vs Square Footage"
      description="Scatter plot of size and actual sale price."
      empty={!loading && !error && scatterSeriesData.length === 0}
      error={error}
      onRetry={onRetry}
    >
      {loading || error || scatterSeriesData.length === 0 ? null : (
        <AnalysisEChart
          className="analysis-chart-canvas"
          option={option}
          ariaLabel="Price versus square footage scatter plot"
          onClick={(event) => {
            const index = event.dataIndex ?? 0;
            const point = scatterSeriesData[index];
            if (!point) {
              return;
            }

            onFilter({ type: "record", recordId: point.recordId });
          }}
        />
      )}
    </ChartCard>
  );
}

function getYearBucketAvgPrice(bucket: AnalysisYearBucket): number {
  const price = bucket.avgPrice ?? bucket.avgPredictedPrice;
  return typeof price === "number" && Number.isFinite(price) ? price : 0;
}

function YearBuiltTrendChart({
  buckets,
  loading,
  error,
  onRetry,
  onFilter,
}: {
  buckets: AnalysisCharts["yearBuiltTrend"];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onFilter: (payload: AnalysisChartClickPayload) => void;
}) {
  const sortedBuckets = useMemo(
    () => [...buckets].sort((a, b) => (a.yearBuilt ?? a.yearStart) - (b.yearBuilt ?? b.yearStart)),
    [buckets],
  );

  const option = useMemo<EChartsOption>(() => {
    const yearLabels = sortedBuckets.map((bucket) => String(bucket.yearBuilt ?? bucket.yearStart));
    const countData = sortedBuckets.map((bucket) => Number(bucket.count) || 0);
    const priceData = sortedBuckets.map((bucket) => getYearBucketAvgPrice(bucket));
    const rotateLabels = yearLabels.length > 10;

    const priceMin = priceData.length > 0 ? Math.min(...priceData) : 0;
    const priceMax = priceData.length > 0 ? Math.max(...priceData) : 0;
    const pricePadding = Math.max((priceMax - priceMin) * 0.08, 5_000);

    return {
      color: [...DASHBOARD_CHART_COLOR_SERIES],
      tooltip: {
        ...getDashboardTooltip("axis"),
        axisPointer: { type: "cross" },
      },
      legend: getDashboardLegend(),
      grid: getDashboardGrid({ bottom: rotateLabels ? 64 : 52, dualAxis: true }),
      xAxis: {
        ...getDashboardCategoryXAxis("Year built", yearLabels, { rotate: rotateLabels, yearLabels: true }),
        axisPointer: { type: "shadow" },
      },
      yAxis: [
        getDashboardCountAxis("left"),
        getDashboardPriceAxis(
          "right",
          {
            min: Math.max(0, Math.floor(priceMin - pricePadding)),
            max: Math.ceil(priceMax + pricePadding),
            splitLine: { show: false },
          },
          "Avg price",
        ),
      ],
      series: [
        {
          name: "Count",
          type: "bar",
          xAxisIndex: 0,
          yAxisIndex: 0,
          z: 1,
          barMaxWidth: 28,
          data: countData,
          ...getDashboardBarSeriesStyle(),
        },
        {
          name: "Avg price",
          type: "line",
          xAxisIndex: 0,
          yAxisIndex: 1,
          z: 3,
          smooth: false,
          showSymbol: true,
          symbol: "circle",
          symbolSize: 7,
          connectNulls: false,
          data: priceData,
          ...getDashboardLineSeriesStyle(),
          emphasis: {
            ...getDashboardLineSeriesStyle().emphasis,
            focus: "series",
          },
        },
      ],
    };
  }, [sortedBuckets]);

  return (
    <ChartCard
      title="Year Built Trend"
      description="Bar chart shows record count by year built; line chart shows average sale price."
      empty={!loading && !error && sortedBuckets.length === 0}
      error={error}
      onRetry={onRetry}
    >
      {loading || error || sortedBuckets.length === 0 ? null : (
        <AnalysisEChart
          className="analysis-chart-canvas"
          option={option}
          ariaLabel="Year built trend chart with count bars and average price line"
          onClick={(event) => {
            const index = event.dataIndex ?? 0;
            const bucket = sortedBuckets[index];
            if (!bucket) {
              return;
            }

            onFilter({
              type: "yearBuilt",
              yearBuiltMin: bucket.yearBuilt ?? bucket.yearStart,
              yearBuiltMax: bucket.yearEnd ?? bucket.yearBuilt ?? bucket.yearStart,
            });
          }}
        />
      )}
    </ChartCard>
  );
}
