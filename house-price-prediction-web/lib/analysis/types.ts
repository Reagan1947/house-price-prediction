import type { PredictionRecord, ValuationFeatureInput } from "@/lib/valuation/types";

export type AnalysisTab = "dashboard" | "segments" | "scenarios" | "data";

export type PropertyType = "apartment" | "house" | "villa" | "townhouse";

export type AnalysisRangeDimensionId =
  | "squareFootage"
  | "bedrooms"
  | "bathrooms"
  | "yearBuilt"
  | "lotSize"
  | "distanceToCityCenter"
  | "schoolRating";

export type AnalysisFilterInput = {
  keyword?: string;
  region?: string[];
  propertyType?: PropertyType;
  activeDimensions?: AnalysisRangeDimensionId[];
  squareFootageMin?: number;
  squareFootageMax?: number;
  bedroomsMin?: number;
  bedroomsMax?: number;
  bathroomsMin?: number;
  bathroomsMax?: number;
  yearBuiltMin?: number;
  yearBuiltMax?: number;
  lotSizeMin?: number;
  lotSizeMax?: number;
  distanceToCityCenterMin?: number;
  distanceToCityCenterMax?: number;
  priceMin?: number;
  priceMax?: number;
  schoolRatingMin?: number;
  schoolRatingMax?: number;
  sort?: string;
  order?: "asc" | "desc";
  page?: number;
  size?: 10 | 20 | 50;
  highlightId?: string;
};

export type AnalysisKpis = {
  totalRecords: number;
  avgPredictedPrice: number;
  medianPredictedPrice: number;
  avgPricePerSquareFoot: number;
  /** Present only when dataset filters are applied (subset vs full market). */
  deltaVsBaseline?: {
    avgPredictedPrice: number;
    medianPredictedPrice: number;
    avgPricePerSquareFoot: number;
  };
};

export type AnalysisHistogramBucket = {
  label: string;
  rangeStart: number;
  rangeEnd: number;
  count: number;
};

export type AnalysisScatterPoint = {
  recordId: string;
  title: string;
  squareFootage: number;
  price: number;
  predictedPrice: number;
};

export type AnalysisYearBucket = {
  yearBuilt: number;
  yearStart: number;
  yearEnd: number;
  avgPrice: number;
  avgPredictedPrice: number;
  count: number;
};

export type AnalysisCharts = {
  priceDistribution: AnalysisHistogramBucket[];
  priceVsSquareFootage: AnalysisScatterPoint[];
  yearBuiltTrend: AnalysisYearBucket[];
};

export type AnalysisDashboardData = {
  kpis: AnalysisKpis;
  charts: AnalysisCharts;
  filteredCount: number;
  totalCount: number;
  performanceWarning?: string;
};

export type ScenarioBaseline = {
  source: "filterMedian";
  recordCount: number;
  features: ValuationFeatureInput;
  predictedPrice: number;
  /** Set when scenario features were seeded from a prediction record. */
  scenarioSeedRecordId?: string;
};

export type ScenarioResult = {
  baseline: ScenarioBaseline;
  scenarioFeatures: ValuationFeatureInput;
  scenarioPrice: number;
  delta: number;
  deltaPercent: number | null;
};

export type AnalysisRecordsResult = {
  items: PredictionRecord[];
  total: number;
  page: number;
  size: number;
};

export type AnalysisSegmentGroupKey =
  | "bedrooms"
  | "bathrooms"
  | "year_built_decade"
  | "school_rating_band"
  | "distance_band";

export type AnalysisSegmentRow = {
  id: string;
  group: string;
  count: number;
  median: number;
  mean: number;
  p25: number;
  p75: number;
  stdDev: number;
  filterPatch: Partial<AnalysisFilterInput>;
};

export type AnalysisSegmentsResult = {
  groupBy: AnalysisSegmentGroupKey;
  rows: AnalysisSegmentRow[];
  filteredCount: number;
  totalCount: number;
};

export type AnalysisChartClickPayload =
  | { type: "priceRange"; priceMin: number; priceMax: number }
  | { type: "yearBuilt"; yearBuiltMin: number; yearBuiltMax: number }
  | { type: "record"; recordId: string };
