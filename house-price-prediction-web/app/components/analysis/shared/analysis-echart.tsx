"use client";

import { useEffect, useRef } from "react";
import type { EChartsOption } from "echarts";
import * as echarts from "echarts/core";
import { BarChart, LineChart, ScatterChart } from "echarts/charts";
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

let echartsRegistered = false;

function ensureEchartsRegistered() {
  if (echartsRegistered) {
    return;
  }

  echarts.use([
    BarChart,
    LineChart,
    ScatterChart,
    CanvasRenderer,
    GridComponent,
    TooltipComponent,
    LegendComponent,
  ]);
  echartsRegistered = true;
}

export type AnalysisChartClickEvent = {
  name?: string;
  dataIndex?: number;
  seriesIndex?: number;
  data?: unknown;
};

type AnalysisEChartProps = {
  option: EChartsOption;
  className?: string;
  ariaLabel: string;
  onClick?: (event: AnalysisChartClickEvent) => void;
};

export function AnalysisEChart({ option, className, ariaLabel, onClick }: AnalysisEChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const onClickRef = useRef(onClick);

  useEffect(() => {
    onClickRef.current = onClick;
  }, [onClick]);

  useEffect(() => {
    ensureEchartsRegistered();

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const chart = echarts.init(container);
    chartRef.current = chart;

    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
    });
    resizeObserver.observe(container);

    const handleClick = (event: unknown) => {
      onClickRef.current?.(event as AnalysisChartClickEvent);
    };
    chart.on("click", handleClick as (event: unknown) => void);

    return () => {
      resizeObserver.disconnect();
      chart.off("click", handleClick);
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option, true);
  }, [option]);

  return <div ref={containerRef} className={className} role="img" aria-label={ariaLabel} />;
}

