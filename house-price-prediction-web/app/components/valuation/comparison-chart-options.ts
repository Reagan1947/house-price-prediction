import type { EChartsOption } from "echarts";
import type { ComparisonSeries } from "@/lib/valuation/types";
import { getComparisonFeatureIndicators, getComparisonFeatureValues } from "./comparison-chart-config";
import {
  COMPARISON_CHART_STYLE,
  getComparisonSeriesColor,
  getComparisonTooltip,
  getSeriesOpacity,
} from "./comparison-chart-theme";

function formatPriceAxisLabel(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `$${Math.round(value / 1_000)}k`;
  }

  return `$${value}`;
}

const comparisonLegend = {
  type: "scroll" as const,
  bottom: 0,
  icon: "rect" as const,
  itemWidth: 10,
  itemHeight: 10,
  itemGap: 18,
  textStyle: {
    color: COMPARISON_CHART_STYLE.legendText,
    fontSize: 12,
  },
  selectedMode: false as const,
};

export function buildComparisonRadarOption(
  series: ComparisonSeries[],
  focusedRecordId: string | null,
): EChartsOption {
  return {
    color: series.map((_, index) => getComparisonSeriesColor(index)),
    tooltip: {
      ...getComparisonTooltip(),
      trigger: "item",
    },
    legend: {
      ...comparisonLegend,
      data: series.map((item) => item.title),
    },
    radar: {
      indicator: getComparisonFeatureIndicators(series),
      radius: "58%",
      center: ["50%", "46%"],
      splitNumber: 4,
      splitLine: {
        lineStyle: {
          color: COMPARISON_CHART_STYLE.gridLine,
          width: 1,
        },
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ["rgba(248, 250, 252, 0.6)", "rgba(255, 255, 255, 0)"],
        },
      },
      axisLine: {
        lineStyle: {
          color: COMPARISON_CHART_STYLE.axisLine,
          width: 1,
        },
      },
      axisName: {
        color: COMPARISON_CHART_STYLE.axisLabel,
        fontSize: 11,
      },
    },
    series: [
      {
        type: "radar",
        symbol: "circle",
        symbolSize: 4,
        data: series.map((item, index) => {
          const color = getComparisonSeriesColor(index);
          const opacity = getSeriesOpacity(item.recordId, focusedRecordId);
          const isFocused = focusedRecordId === item.recordId;

          return {
            name: item.title,
            value: getComparisonFeatureValues(item),
            recordId: item.recordId,
            lineStyle: {
              color,
              width: isFocused ? COMPARISON_CHART_STYLE.lineWidthFocused : COMPARISON_CHART_STYLE.lineWidth,
              opacity,
            },
            areaStyle: {
              color,
              opacity: opacity * (isFocused ? COMPARISON_CHART_STYLE.areaOpacityFocused : COMPARISON_CHART_STYLE.areaOpacity),
            },
            itemStyle: {
              color,
              opacity,
              borderWidth: 0,
            },
          };
        }),
      },
    ],
  };
}

export function buildComparisonBarOption(
  series: ComparisonSeries[],
  focusedRecordId: string | null,
): EChartsOption {
  return {
    color: series.map((_, index) => getComparisonSeriesColor(index)),
    tooltip: {
      ...getComparisonTooltip(),
      trigger: "axis",
      axisPointer: {
        type: "shadow",
        shadowStyle: {
          color: "rgba(91, 141, 239, 0.06)",
        },
      },
      valueFormatter: (value) => {
        const amount = typeof value === "number" ? value : Number(value);
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(amount);
      },
    },
    grid: {
      left: 48,
      right: 20,
      top: 20,
      bottom: series.length > 4 ? 80 : 56,
      containLabel: false,
    },
    xAxis: {
      type: "category",
      data: series.map((item) => item.title),
      axisLine: {
        lineStyle: {
          color: COMPARISON_CHART_STYLE.axisLine,
        },
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        interval: 0,
        rotate: series.length > 4 ? 28 : 0,
        width: 72,
        overflow: "truncate",
        color: COMPARISON_CHART_STYLE.axisLabel,
        fontSize: 11,
      },
    },
    yAxis: {
      type: "value",
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: COMPARISON_CHART_STYLE.axisLabel,
        fontSize: 11,
        formatter: (value: number) => formatPriceAxisLabel(value),
      },
      splitLine: {
        lineStyle: {
          color: COMPARISON_CHART_STYLE.gridLine,
          type: "dashed",
        },
      },
    },
    series: [
      {
        type: "bar",
        barMaxWidth: 44,
        data: series.map((item, index) => {
          const color = getComparisonSeriesColor(index);
          const opacity = getSeriesOpacity(item.recordId, focusedRecordId);

          return {
            name: item.title,
            value: item.predictedPrice,
            recordId: item.recordId,
            itemStyle: {
              color,
              opacity,
            },
            emphasis: {
              itemStyle: {
                opacity: 1,
              },
            },
          };
        }),
      },
    ],
  };
}

export type ComparisonChartClickEvent = {
  componentType?: string;
  seriesType?: string;
  dataIndex?: number;
  name?: string;
};

export function resolveComparisonChartRecordId(
  series: ComparisonSeries[],
  event: ComparisonChartClickEvent,
): string | null {
  if (event.componentType === "series") {
    if (event.seriesType === "radar" && typeof event.dataIndex === "number") {
      return series[event.dataIndex]?.recordId ?? null;
    }

    if (event.seriesType === "bar" && typeof event.dataIndex === "number") {
      return series[event.dataIndex]?.recordId ?? null;
    }
  }

  if (event.componentType === "legend" && event.name) {
    return series.find((item) => item.title === event.name)?.recordId ?? null;
  }

  return null;
}
