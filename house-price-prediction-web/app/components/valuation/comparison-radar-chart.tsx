"use client";

import { useCallback, useMemo } from "react";
import type { ComparisonSeries } from "@/lib/valuation/types";
import { buildComparisonRadarOption, resolveComparisonChartRecordId } from "./comparison-chart-options";
import { ComparisonEChart } from "./comparison-echart";

type ComparisonRadarChartProps = {
  series: ComparisonSeries[];
  focusedRecordId: string | null;
  onFocusRecord: (recordId: string) => void;
};

export function ComparisonRadarChart({ series, focusedRecordId, onFocusRecord }: ComparisonRadarChartProps) {
  const option = useMemo(() => buildComparisonRadarOption(series, focusedRecordId), [focusedRecordId, series]);

  const handleChartClick = useCallback(
    (event: Parameters<typeof resolveComparisonChartRecordId>[1]) => {
      const recordId = resolveComparisonChartRecordId(series, event);
      if (recordId) {
        onFocusRecord(recordId);
      }
    },
    [onFocusRecord, series],
  );

  return (
    <div className="valuation-chart-card">
      <h3 className="valuation-chart-title">Feature Radar Comparison</h3>
      <p className="valuation-chart-hint">Click a series or legend item to highlight it across all comparison views.</p>
      <ComparisonEChart option={option} className="valuation-echart valuation-echart-radar" onClick={handleChartClick} />
    </div>
  );
}
