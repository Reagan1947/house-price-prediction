import type { TooltipComponentOption } from "echarts";

/** Muted, distinct hues for multi-series comparison (modern data-viz palette). */
export const COMPARISON_SERIES_COLORS = [
  "#5B8DEF",
  "#3DBEAE",
  "#94A3B8",
  "#E8A04B",
  "#B07CC6",
  "#6B8F71",
] as const;

export const COMPARISON_CHART_STYLE = {
  gridLine: "#F1F4F8",
  axisLine: "#E8ECF1",
  axisLabel: "#64748B",
  legendText: "#64748B",
  titleText: "#1E293B",
  tooltipBg: "#FFFFFF",
  tooltipBorder: "#E8ECF1",
  tooltipText: "#334155",
  accent: "#5B8DEF",
  accentSoft: "#EEF4FF",
  mutedOpacity: 0.22,
  areaOpacity: 0.1,
  areaOpacityFocused: 0.18,
  lineWidth: 1.5,
  lineWidthFocused: 2.5,
} as const;

export function getComparisonSeriesColor(index: number): string {
  return COMPARISON_SERIES_COLORS[index % COMPARISON_SERIES_COLORS.length];
}

export function getComparisonSeriesIndex(series: { recordId: string }[], recordId: string): number {
  return series.findIndex((item) => item.recordId === recordId);
}

export function getSeriesOpacity(recordId: string, focusedRecordId: string | null): number {
  if (!focusedRecordId) {
    return 1;
  }

  return focusedRecordId === recordId ? 1 : COMPARISON_CHART_STYLE.mutedOpacity;
}

export function getComparisonTooltip(): TooltipComponentOption {
  return {
    backgroundColor: COMPARISON_CHART_STYLE.tooltipBg,
    borderColor: COMPARISON_CHART_STYLE.tooltipBorder,
    borderWidth: 1,
    padding: [10, 14],
    textStyle: {
      color: COMPARISON_CHART_STYLE.tooltipText,
      fontSize: 12,
    },
    extraCssText: "box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08); border-radius: 8px;",
  };
}
