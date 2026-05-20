"use client";

import { useCallback, useMemo } from "react";
import type { ComparisonSeries } from "@/lib/valuation/types";
import { buildComparisonBarOption, resolveComparisonChartRecordId } from "./comparison-chart-options";
import { ComparisonEChart } from "./comparison-echart";

type ComparisonPriceChartProps = {
  series: ComparisonSeries[];
  focusedRecordId: string | null;
  onFocusRecord: (recordId: string) => void;
};

export function ComparisonPriceChart({ series, focusedRecordId, onFocusRecord }: ComparisonPriceChartProps) {
  const option = useMemo(() => buildComparisonBarOption(series, focusedRecordId), [focusedRecordId, series]);

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
      <h3 className="valuation-chart-title">Prediction Price Comparison</h3>
      <p className="valuation-chart-hint">Click a bar to highlight the same record in other views.</p>
      <ComparisonEChart option={option} className="valuation-echart valuation-echart-bar" onClick={handleChartClick} />
    </div>
  );
}
