"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import type { EChartsOption } from "echarts";
import {
  DASHBOARD_CHART_COLORS,
  DASHBOARD_CHART_COLOR_SERIES,
  getDashboardBarSeriesStyle,
  getDashboardCategoryXAxis,
  getDashboardCountAxis,
  getDashboardGrid,
  getDashboardLegend,
  getDashboardLineSeriesStyle,
  getDashboardPriceAxis,
  getDashboardTooltip,
} from "../dashboard/dashboard-chart-theme";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatNumber, formatUsd } from "@/lib/analysis/format";
import type {
  AnalysisSegmentGroupKey,
  AnalysisSegmentRow,
  AnalysisSegmentsResult,
} from "@/lib/analysis/types";
import { AnalysisEChart } from "../shared/analysis-echart";
import { ChartCard } from "../dashboard/chart-card";

type SegmentSortField = "group" | "count" | "median" | "mean" | "p25" | "p75" | "stdDev";

type SegmentSort = {
  field: SegmentSortField;
  order: "asc" | "desc";
};

type SegmentsTabProps = {
  result: AnalysisSegmentsResult | null;
  groupBy: AnalysisSegmentGroupKey;
  loading: boolean;
  error: string | null;
  onGroupByChange: (groupBy: AnalysisSegmentGroupKey) => void;
  onRetry: () => void;
  onDrillDown: (row: AnalysisSegmentRow) => void;
};

const GROUP_BY_OPTIONS: Array<{ value: AnalysisSegmentGroupKey; label: string }> = [
  { value: "bedrooms", label: "Bedrooms" },
  { value: "bathrooms", label: "Bathrooms" },
  { value: "year_built_decade", label: "Year Built Decade" },
  { value: "school_rating_band", label: "School Rating Band" },
  { value: "distance_band", label: "Distance Band" },
];

const COLUMN_COUNT = 8;

function getSortValue(row: AnalysisSegmentRow, field: SegmentSortField): string | number {
  if (field === "group") {
    return row.group;
  }

  return row[field];
}

function sortRows(rows: AnalysisSegmentRow[], sort: SegmentSort): AnalysisSegmentRow[] {
  return [...rows].sort((a, b) => {
    const aValue = getSortValue(a, sort.field);
    const bValue = getSortValue(b, sort.field);
    const result =
      typeof aValue === "string" && typeof bValue === "string"
        ? aValue.localeCompare(bValue, undefined, { numeric: true })
        : Number(aValue) - Number(bValue);

    return sort.order === "asc" ? result : -result;
  });
}

function sortAria(field: SegmentSortField, sort: SegmentSort): "ascending" | "descending" | "none" {
  if (sort.field !== field) {
    return "none";
  }

  return sort.order === "asc" ? "ascending" : "descending";
}

type SortableHeaderProps = {
  label: ReactNode;
  field: SegmentSortField;
  sort: SegmentSort;
  onSort: (field: SegmentSortField) => void;
  className?: string;
};

function SortableHeader({ label, field, sort, onSort, className }: SortableHeaderProps) {
  const isActive = sort.field === field;

  return (
    <th scope="col" className={className} aria-sort={sortAria(field, sort)}>
      <button
        type="button"
        className="valuation-table-sort-btn"
        data-active={isActive ? "true" : "false"}
        onClick={() => onSort(field)}
      >
        <span className="valuation-table-sort-btn-label">{label}</span>
        <span aria-hidden="true" className="valuation-table-sort-btn-icon">
          {isActive && sort.order === "asc" ? (
            <ArrowUp size={12} strokeWidth={2.25} />
          ) : isActive && sort.order === "desc" ? (
            <ArrowDown size={12} strokeWidth={2.25} />
          ) : (
            <ChevronsUpDown size={12} strokeWidth={2.25} />
          )}
        </span>
      </button>
    </th>
  );
}

function SegmentsChart({
  rows,
  selectedId,
  onSelect,
  loading,
}: {
  rows: AnalysisSegmentRow[];
  selectedId: string | null;
  onSelect: (row: AnalysisSegmentRow) => void;
  loading: boolean;
}) {
  const option = useMemo<EChartsOption>(() => {
    const groupLabels = rows.map((row) => row.group);
    const countData = rows.map((row) => row.count);
    const medianData = rows.map((row) => row.median);
    const rotateLabels = groupLabels.length > 6;

    const priceMin = medianData.length > 0 ? Math.min(...medianData) : 0;
    const priceMax = medianData.length > 0 ? Math.max(...medianData) : 0;
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
        ...getDashboardCategoryXAxis("Group", groupLabels, { rotate: rotateLabels }),
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
          "Median price",
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
          ...getDashboardBarSeriesStyle(),
          data: countData.map((value, index) => {
            const row = rows[index];
            const isSelected = row && selectedId === row.id;

            return {
              value,
              itemStyle: {
                color: isSelected ? DASHBOARD_CHART_COLORS.count : DASHBOARD_CHART_COLORS.countSoft,
                borderColor: isSelected ? DASHBOARD_CHART_COLORS.count : "transparent",
                borderWidth: isSelected ? 2 : 0,
              },
            };
          }),
        },
        {
          name: "Median price",
          type: "line",
          xAxisIndex: 0,
          yAxisIndex: 1,
          z: 3,
          smooth: false,
          showSymbol: true,
          symbol: "circle",
          symbolSize: 7,
          connectNulls: false,
          data: medianData,
          ...getDashboardLineSeriesStyle(),
          emphasis: {
            ...getDashboardLineSeriesStyle().emphasis,
            focus: "series",
          },
        },
      ],
    };
  }, [rows, selectedId]);

  return (
    <ChartCard
      className="analysis-segments-chart-panel"
      title="Segment Count vs Median Price"
      description="Bar chart shows record count by group; line chart shows median sale price."
      empty={!loading && rows.length === 0}
    >
      {loading || rows.length === 0 ? null : (
        <AnalysisEChart
          className="analysis-chart-canvas"
          option={option}
          ariaLabel="Segment comparison chart showing count and median predicted price"
          onClick={(event) => {
            const row = rows[event.dataIndex ?? -1];
            if (row) {
              onSelect(row);
            }
          }}
        />
      )}
    </ChartCard>
  );
}

function SegmentsTabContent({
  result,
  groupBy,
  loading,
  error,
  onGroupByChange,
  onRetry,
  onDrillDown,
}: SegmentsTabProps) {
  const [sort, setSort] = useState<SegmentSort>({ field: "median", order: "desc" });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const showData = !error && !loading && result !== null;
  const rows = useMemo(
    () => (showData ? sortRows(result.rows, sort) : []),
    [result, showData, sort],
  );

  const handleSort = (field: SegmentSortField) => {
    setSort((current) => ({
      field,
      order: current.field === field && current.order === "desc" ? "asc" : "desc",
    }));
  };

  const handleSelect = (row: AnalysisSegmentRow) => {
    setSelectedId(row.id);
  };

  return (
    <section className="analysis-segments-tab" aria-labelledby="analysis-page-title">
      {error ? (
        <div className="valuation-feedback valuation-feedback-danger" role="alert">
          <p>{error}</p>
          <button type="button" className="valuation-inline-btn" onClick={onRetry}>
            Retry
          </button>
        </div>
      ) : null}

      {showData && rows.length === 0 ? (
        <div className="analysis-empty" role="status">
          <p>No segments match the current filters.</p>
        </div>
      ) : null}

      <header className="analysis-segments-table-head">
        <div className="analysis-panel-heading">
          <h2 id="analysis-segments-table-title" className="analysis-data-tab-title">
            Data Table
          </h2>
          <p className="analysis-panel-description">
            Review segment group statistics and sort columns to compare counts and price metrics.
          </p>
        </div>
        <div className="analysis-segments-control valuation-filter-field valuation-filter-field-text analysis-dimension-field-col">
          <label htmlFor="analysis-segments-group-by" className="analysis-dimension-label">
            Group By
          </label>
          <Select value={groupBy} onValueChange={(value) => onGroupByChange(value as AnalysisSegmentGroupKey)}>
            <SelectTrigger
              id="analysis-segments-group-by"
              className="portal-filter-select analysis-filter-select analysis-dimension-control hover:bg-[var(--portal-color-surface)] focus:bg-[var(--portal-color-surface)] data-[state=open]:bg-[var(--portal-color-surface)] focus-visible:ring-0"
              aria-label="Group by dimension"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="portal-filter-select-content analysis-filter-select-content analysis-dimension-select-content">
              {GROUP_BY_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="portal-filter-select-item analysis-filter-select-item"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      {error ? null : (
      <div className="valuation-table-panel analysis-table-panel analysis-segments-table-panel">
        <div className="valuation-table-shell">
          <table className="valuation-table valuation-data-table valuation-data-table-compact analysis-segments-table">
            <caption className="sr-only">Segment comparison statistics</caption>
            <thead>
              <tr>
                <SortableHeader label="Group" field="group" sort={sort} onSort={handleSort} />
                <SortableHeader
                  label="Count"
                  field="count"
                  sort={sort}
                  onSort={handleSort}
                  className="valuation-table-cell-numeric"
                />
                <SortableHeader
                  label="Median"
                  field="median"
                  sort={sort}
                  onSort={handleSort}
                  className="valuation-table-cell-numeric"
                />
                <SortableHeader
                  label="Mean"
                  field="mean"
                  sort={sort}
                  onSort={handleSort}
                  className="valuation-table-cell-numeric"
                />
                <SortableHeader
                  label="P25"
                  field="p25"
                  sort={sort}
                  onSort={handleSort}
                  className="valuation-table-cell-numeric"
                />
                <SortableHeader
                  label="P75"
                  field="p75"
                  sort={sort}
                  onSort={handleSort}
                  className="valuation-table-cell-numeric"
                />
                <SortableHeader
                  label="Std Dev"
                  field="stdDev"
                  sort={sort}
                  onSort={handleSort}
                  className="valuation-table-cell-numeric"
                />
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <tr key={`segment-skeleton-${index}`} className="analysis-table-skeleton-row">
                      {Array.from({ length: COLUMN_COUNT }).map((__, columnIndex) => (
                        <td key={columnIndex}>
                          <span className="analysis-table-skeleton" />
                        </td>
                      ))}
                    </tr>
                  ))
                : rows.map((row, index) => (
                    <tr
                      key={row.id}
                      className={[
                        index % 2 === 1 ? "valuation-table-row-striped" : undefined,
                        selectedId === row.id ? "valuation-table-row-highlight" : undefined,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      aria-selected={selectedId === row.id}
                      tabIndex={0}
                      onClick={() => handleSelect(row)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleSelect(row);
                        }
                      }}
                    >
                      <th scope="row">{row.group}</th>
                      <td className="valuation-table-cell-numeric tabular-nums">{formatNumber(row.count)}</td>
                      <td className="valuation-table-cell-numeric tabular-nums">{formatUsd(row.median)}</td>
                      <td className="valuation-table-cell-numeric tabular-nums">{formatUsd(row.mean)}</td>
                      <td className="valuation-table-cell-numeric tabular-nums">{formatUsd(row.p25)}</td>
                      <td className="valuation-table-cell-numeric tabular-nums">{formatUsd(row.p75)}</td>
                      <td className="valuation-table-cell-numeric tabular-nums">{formatUsd(row.stdDev)}</td>
                      <td>
                        <button
                          type="button"
                          className="valuation-inline-btn"
                          onClick={(event) => {
                            event.stopPropagation();
                            onDrillDown(row);
                          }}
                        >
                          Drill Down
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {error ? null : (
        <SegmentsChart
          rows={rows}
          selectedId={selectedId}
          onSelect={handleSelect}
          loading={loading}
        />
      )}
    </section>
  );
}

export function SegmentsTab(props: SegmentsTabProps) {
  return <SegmentsTabContent key={props.groupBy} {...props} />;
}
