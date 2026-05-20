"use client";

import { useEffect, useRef } from "react";
import type { EChartsOption } from "echarts";
import * as echarts from "echarts/core";
import type { ComparisonChartClickEvent } from "./comparison-chart-options";
import { BarChart, RadarChart } from "echarts/charts";
import {
  GridComponent,
  LegendComponent,
  RadarComponent,
  TooltipComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

let echartsRegistered = false;

function ensureEchartsRegistered() {
  if (echartsRegistered) {
    return;
  }

  echarts.use([BarChart, RadarChart, CanvasRenderer, GridComponent, TooltipComponent, LegendComponent, RadarComponent]);
  echartsRegistered = true;
}

type ComparisonEChartProps = {
  option: EChartsOption;
  className?: string;
  onClick?: (event: ComparisonChartClickEvent) => void;
};

export function ComparisonEChart({ option, className, onClick }: ComparisonEChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const onClickRef = useRef(onClick);

  onClickRef.current = onClick;

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
      onClickRef.current?.(event as ComparisonChartClickEvent);
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

  return <div ref={containerRef} className={className} role="img" />;
}
