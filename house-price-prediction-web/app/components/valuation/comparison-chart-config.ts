import type { ComparisonSeries, ValuationFeatureInput } from "@/lib/valuation/types";

export const COMPARISON_FEATURE_CONFIG: Array<{ key: keyof ValuationFeatureInput; label: string }> = [
  { key: "squareFootage", label: "Square Footage" },
  { key: "bedrooms", label: "Bedrooms" },
  { key: "bathrooms", label: "Bathrooms" },
  { key: "yearBuilt", label: "Year Built" },
  { key: "lotSize", label: "Lot Size" },
  { key: "distanceToCityCenter", label: "Distance" },
  { key: "schoolRating", label: "School" },
];

function getIndicatorMax(series: ComparisonSeries[], key: keyof ValuationFeatureInput): number {
  const max = series.reduce((currentMax, item) => Math.max(currentMax, item.features[key]), 0);
  return max <= 0 ? 1 : max;
}

export function getComparisonFeatureIndicators(series: ComparisonSeries[]) {
  return COMPARISON_FEATURE_CONFIG.map((field) => ({
    name: field.label,
    max: getIndicatorMax(series, field.key),
  }));
}

export function getComparisonFeatureValues(item: ComparisonSeries): number[] {
  return COMPARISON_FEATURE_CONFIG.map((field) => item.features[field.key]);
}
