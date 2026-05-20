import type { ValuationFeatureInput } from "@/lib/valuation/types";
import type { ScenarioBaseline, ScenarioResult } from "./types";

const FEATURE_KEYS: Array<keyof ValuationFeatureInput> = [
  "squareFootage",
  "bedrooms",
  "bathrooms",
  "yearBuilt",
  "lotSize",
  "distanceToCityCenter",
  "schoolRating",
];

export function buildScenarioResult(
  baseline: ScenarioBaseline,
  scenarioFeatures: ValuationFeatureInput,
  scenarioPrice: number,
): ScenarioResult {
  const delta = scenarioPrice - baseline.predictedPrice;
  const deltaPercent =
    baseline.predictedPrice === 0 ? null : (delta / baseline.predictedPrice) * 100;

  return {
    baseline,
    scenarioFeatures,
    scenarioPrice,
    delta,
    deltaPercent,
  };
}

export type FeatureDiffRow = {
  key: keyof ValuationFeatureInput;
  label: string;
  baseline: number;
  scenario: number;
  diff: number;
};

const FEATURE_LABELS: Record<keyof ValuationFeatureInput, string> = {
  squareFootage: "Square Footage",
  bedrooms: "Bedrooms",
  bathrooms: "Bathrooms",
  yearBuilt: "Year Built",
  lotSize: "Lot Size",
  distanceToCityCenter: "Distance to City Center",
  schoolRating: "School Rating",
};

export function buildFeatureDiffRows(
  baseline: ValuationFeatureInput,
  scenario: ValuationFeatureInput,
): FeatureDiffRow[] {
  return FEATURE_KEYS.map((key) => ({
    key,
    label: FEATURE_LABELS[key],
    baseline: baseline[key],
    scenario: scenario[key],
    diff: scenario[key] - baseline[key],
  }));
}

export const SCENARIO_FIELD_UNITS: Record<keyof ValuationFeatureInput, string> = {
  squareFootage: "sq ft",
  bedrooms: "rooms",
  bathrooms: "rooms",
  yearBuilt: "year",
  lotSize: "sq ft",
  distanceToCityCenter: "km",
  schoolRating: "0-10",
};

const SCENARIO_RANGE_UNIT_FIELDS = new Set<keyof ValuationFeatureInput>([
  "squareFootage",
  "lotSize",
  "distanceToCityCenter",
]);

export function formatScenarioFieldValue(
  key: keyof ValuationFeatureInput,
  value: number,
): string {
  const limits = SCENARIO_FIELD_LIMITS[key];
  if (limits.integer) {
    return Math.round(value).toLocaleString();
  }
  if (limits.step === 0.5) {
    return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
  }
  return value.toLocaleString();
}

export function formatScenarioRangeLabel(
  key: keyof ValuationFeatureInput,
  value: number,
): string {
  const formatted = formatScenarioFieldValue(key, value);
  if (!SCENARIO_RANGE_UNIT_FIELDS.has(key)) {
    return formatted;
  }
  return `${formatted} ${SCENARIO_FIELD_UNITS[key]}`;
}

export const SCENARIO_FIELD_LIMITS: Record<
  keyof ValuationFeatureInput,
  { min: number; max: number; step: number; integer?: boolean }
> = {
  squareFootage: { min: 1, max: 20000, step: 50 },
  bedrooms: { min: 0, max: 20, step: 1, integer: true },
  bathrooms: { min: 0, max: 20, step: 0.5 },
  yearBuilt: { min: 1800, max: new Date().getFullYear(), step: 1, integer: true },
  lotSize: { min: 1, max: 50000, step: 100 },
  distanceToCityCenter: { min: 0, max: 200, step: 0.5 },
  schoolRating: { min: 0, max: 10, step: 0.5 },
};

export function validateScenarioFeatures(features: ValuationFeatureInput): Partial<
  Record<keyof ValuationFeatureInput, string>
> {
  const errors: Partial<Record<keyof ValuationFeatureInput, string>> = {};
  const currentYear = new Date().getFullYear();

  (Object.keys(SCENARIO_FIELD_LIMITS) as Array<keyof ValuationFeatureInput>).forEach((key) => {
    const value = features[key];
    const limits = SCENARIO_FIELD_LIMITS[key];

    if (!Number.isFinite(value)) {
      errors[key] = "Enter a valid number.";
      return;
    }

    if (key === "squareFootage" && value <= 0) {
      errors[key] = "Value must be greater than 0.";
      return;
    }

    if (key === "lotSize" && value <= 0) {
      errors[key] = "Value must be greater than 0.";
      return;
    }

    if (value < limits.min || value > limits.max) {
      errors[key] = `Value must be between ${limits.min} and ${limits.max}.`;
      return;
    }

    if (limits.integer && !Number.isInteger(value)) {
      errors[key] = "Value must be a whole number.";
      return;
    }

    if (key === "yearBuilt" && (value < 1800 || value > currentYear)) {
      errors[key] = `Year must be between 1800 and ${currentYear}.`;
      return;
    }

  });

  return errors;
}
