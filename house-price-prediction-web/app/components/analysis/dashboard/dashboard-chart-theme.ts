import type {
  GridComponentOption,
  LegendComponentOption,
  TooltipComponentOption,
  XAXisComponentOption,
  YAXisComponentOption,
} from "echarts";
import { formatNumber, formatUsd } from "@/lib/analysis/format";
import { COMPARISON_CHART_STYLE, getComparisonTooltip } from "@/app/components/valuation/comparison-chart-theme";

/** Shared dashboard chart palette: count / primary bar, price / secondary line, scatter. */
export const DASHBOARD_CHART_COLORS = {
  count: "#5B8DEF",
  countSoft: "#EEF4FF",
  price: "#6929c4",
  scatter: "#5B8DEF",
} as const;

export const DASHBOARD_CHART_COLOR_SERIES = [
  DASHBOARD_CHART_COLORS.count,
  DASHBOARD_CHART_COLORS.price,
] as const;

const AXIS_NAME_STYLE = {
  color: COMPARISON_CHART_STYLE.axisLabel,
  fontSize: 12,
  fontWeight: 500,
} as const;

const AXIS_LABEL_STYLE = {
  color: COMPARISON_CHART_STYLE.axisLabel,
  fontSize: 11,
} as const;

export function getDashboardTooltip(trigger: "axis" | "item" = "axis"): TooltipComponentOption {
  return {
    ...getComparisonTooltip(),
    trigger,
  };
}

export function getDashboardLegend(): LegendComponentOption {
  return {
    top: 8,
    left: "center",
    itemGap: 20,
    itemWidth: 10,
    itemHeight: 10,
    textStyle: {
      color: COMPARISON_CHART_STYLE.legendText,
      fontSize: 12,
    },
  };
}

type DashboardGridOptions = {
  bottom?: number;
  right?: number;
  left?: number;
  dualAxis?: boolean;
};

export function getDashboardGrid(options: DashboardGridOptions = {}): GridComponentOption {
  return {
    left: options.left ?? 56,
    right: options.dualAxis ? 80 : (options.right ?? 24),
    top: 40,
    bottom: options.bottom ?? 52,
    containLabel: false,
  };
}

export function formatDashboardCount(value: number): string {
  return formatNumber(value);
}

export function formatDashboardPrice(value: number): string {
  return formatUsd(value);
}

export function formatDashboardSquareFootage(value: number): string {
  return formatNumber(value);
}

function baseValueAxis(
  name: string,
  position: "left" | "right",
  formatter: (value: number) => string,
  extra: Partial<YAXisComponentOption> = {},
): YAXisComponentOption {
  return {
    type: "value",
    name,
    position,
    nameTextStyle: AXIS_NAME_STYLE,
    nameGap: 12,
    axisLine: { show: true, lineStyle: { color: COMPARISON_CHART_STYLE.axisLine } },
    axisLabel: {
      ...AXIS_LABEL_STYLE,
      formatter,
    },
    splitLine: {
      show: position === "left",
      lineStyle: { color: COMPARISON_CHART_STYLE.gridLine },
    },
    ...extra,
  } as YAXisComponentOption;
}

export function getDashboardCountAxis(
  position: "left" | "right" = "left",
  extra: Partial<YAXisComponentOption> = {},
): YAXisComponentOption {
  return baseValueAxis("Count", position, formatDashboardCount, {
    minInterval: 1,
    ...extra,
  });
}

export function getDashboardPriceAxis(
  position: "left" | "right" = "left",
  extra: Partial<YAXisComponentOption> = {},
  name = "Avg price",
): YAXisComponentOption {
  return baseValueAxis(name, position, formatDashboardPrice, extra);
}

export function getDashboardCategoryXAxis(
  name: string,
  data: string[],
  options: { rotate?: boolean; yearLabels?: boolean } = {},
): XAXisComponentOption {
  const rotate = options.rotate ?? data.length > 10;

  return {
    type: "category",
    name,
    nameLocation: "middle",
    nameGap: rotate ? 42 : 28,
    nameTextStyle: AXIS_NAME_STYLE,
    data,
    axisLine: { lineStyle: { color: COMPARISON_CHART_STYLE.axisLine } },
    axisTick: { alignWithLabel: true },
    axisLabel: {
      ...AXIS_LABEL_STYLE,
      rotate: rotate ? 45 : 0,
      interval: 0,
      hideOverlap: true,
      ...(options.yearLabels
        ? {
            formatter: (value: string) => {
              const year = Number.parseInt(String(value), 10);
              return Number.isFinite(year) ? String(year) : String(value);
            },
          }
        : {}),
    },
  };
}

export function getDashboardSquareFootageXAxis(
  min: number,
  max: number,
): XAXisComponentOption {
  return {
    type: "value",
    name: "Square footage",
    nameLocation: "middle",
    nameGap: 28,
    nameTextStyle: AXIS_NAME_STYLE,
    min,
    max,
    axisLine: { lineStyle: { color: COMPARISON_CHART_STYLE.axisLine } },
    axisLabel: {
      ...AXIS_LABEL_STYLE,
      formatter: formatDashboardSquareFootage,
    },
    splitLine: { lineStyle: { color: COMPARISON_CHART_STYLE.gridLine } },
  };
}

export function getDashboardBarSeriesStyle() {
  return {
    itemStyle: { color: DASHBOARD_CHART_COLORS.countSoft },
    emphasis: {
      itemStyle: { color: DASHBOARD_CHART_COLORS.count },
    },
  };
}

export function getDashboardLineSeriesStyle() {
  return {
    lineStyle: { color: DASHBOARD_CHART_COLORS.price, width: 2.5 },
    itemStyle: { color: DASHBOARD_CHART_COLORS.price, borderColor: "#ffffff", borderWidth: 1 },
    emphasis: {
      lineStyle: { width: 3 },
    },
  };
}

export function getDashboardScatterSeriesStyle() {
  return {
    itemStyle: { color: DASHBOARD_CHART_COLORS.scatter, opacity: 0.85 },
    emphasis: {
      itemStyle: {
        color: DASHBOARD_CHART_COLORS.scatter,
        opacity: 1,
        borderColor: "#ffffff",
        borderWidth: 1,
      },
    },
  };
}
