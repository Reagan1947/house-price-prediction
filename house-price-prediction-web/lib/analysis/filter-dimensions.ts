import type { AnalysisFilterInput, AnalysisRangeDimensionId } from "./types";

export type AnalysisRangeDimensionConfig = {
  id: AnalysisRangeDimensionId;
  /** Snake-case field key (URL / API). */
  fieldKey: string;
  /** Human-readable label for the Field dropdown. */
  label: string;
  /** Unit suffix shown on min/max inputs; omit when not applicable. */
  unit?: string;
  minKey: keyof AnalysisFilterInput;
  maxKey: keyof AnalysisFilterInput;
  integer?: boolean;
};

export const ANALYSIS_FEATURE_DIMENSIONS: AnalysisRangeDimensionConfig[] = [
  {
    id: "squareFootage",
    fieldKey: "square_footage",
    label: "Square footage",
    unit: "sq ft",
    minKey: "squareFootageMin",
    maxKey: "squareFootageMax",
    integer: true,
  },
  {
    id: "bedrooms",
    fieldKey: "bedrooms",
    label: "Bedrooms",
    minKey: "bedroomsMin",
    maxKey: "bedroomsMax",
    integer: true,
  },
  {
    id: "bathrooms",
    fieldKey: "bathrooms",
    label: "Bathrooms",
    minKey: "bathroomsMin",
    maxKey: "bathroomsMax",
  },
  {
    id: "yearBuilt",
    fieldKey: "year_built",
    label: "Year built",
    minKey: "yearBuiltMin",
    maxKey: "yearBuiltMax",
    integer: true,
  },
  {
    id: "lotSize",
    fieldKey: "lot_size",
    label: "Lot size",
    unit: "sq ft",
    minKey: "lotSizeMin",
    maxKey: "lotSizeMax",
    integer: true,
  },
  {
    id: "distanceToCityCenter",
    fieldKey: "distance_to_city_center",
    label: "Distance to city center",
    unit: "km",
    minKey: "distanceToCityCenterMin",
    maxKey: "distanceToCityCenterMax",
  },
  {
    id: "schoolRating",
    fieldKey: "school_rating",
    label: "School rating",
    unit: "/ 10",
    minKey: "schoolRatingMin",
    maxKey: "schoolRatingMax",
  },
];

const DIMENSION_ID_SET = new Set<AnalysisRangeDimensionId>(
  ANALYSIS_FEATURE_DIMENSIONS.map((dimension) => dimension.id),
);

export function isAnalysisRangeDimensionId(value: string): value is AnalysisRangeDimensionId {
  return DIMENSION_ID_SET.has(value as AnalysisRangeDimensionId);
}

export function inferActiveDimensions(filters: AnalysisFilterInput): AnalysisRangeDimensionId[] {
  if (filters.activeDimensions && filters.activeDimensions.length > 0) {
    return filters.activeDimensions;
  }

  return ANALYSIS_FEATURE_DIMENSIONS.filter((dimension) => {
    const min = filters[dimension.minKey];
    const max = filters[dimension.maxKey];
    return min !== undefined || max !== undefined;
  }).map((dimension) => dimension.id);
}

export function getDimensionConfig(id: AnalysisRangeDimensionId): AnalysisRangeDimensionConfig {
  const config = ANALYSIS_FEATURE_DIMENSIONS.find((dimension) => dimension.id === id);
  if (!config) {
    throw new Error(`Unknown analysis dimension: ${id}`);
  }

  return config;
}
