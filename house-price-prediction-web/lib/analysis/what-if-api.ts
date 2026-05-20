import type { ValuationFeatureInput } from "@/lib/valuation/types";
import { toDashboardQueryRequest } from "./dashboard-api";
import { readDashboardApiResponse, getDashboardApiMessage, isDashboardApiSuccess } from "./dashboard-api";
import type { AnalysisFilterInput, ScenarioBaseline } from "./types";

export type WhatIfBaselineQueryRequest = {
  minId?: number;
  maxId?: number;
  minSquareFootage?: number;
  maxSquareFootage?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  minYearBuilt?: number;
  maxYearBuilt?: number;
  minLotSize?: number;
  maxLotSize?: number;
  minDistanceToCityCenter?: number;
  maxDistanceToCityCenter?: number;
  minSchoolRating?: number;
  maxSchoolRating?: number;
  minPrice?: number;
  maxPrice?: number;
  filters?: Partial<WhatIfBaselineQueryRequest>;
};

export type HouseFeaturesVO = ValuationFeatureInput;

export type BaselineVO = {
  recordCount: number;
  features: HouseFeaturesVO;
  baselinePredictedPrice: number;
};

export type ScenarioPredictRequest = {
  features?: HouseFeaturesVO;
  featuresList?: HouseFeaturesVO[];
};

export type ScenarioPredictVO = {
  mode: "single" | "batch";
  count: number;
  predictedPrice?: number | null;
  predictions: number[];
};

const BASELINE_QUERY_KEYS: (keyof WhatIfBaselineQueryRequest)[] = [
  "minId",
  "maxId",
  "minSquareFootage",
  "maxSquareFootage",
  "minBedrooms",
  "maxBedrooms",
  "minBathrooms",
  "maxBathrooms",
  "minYearBuilt",
  "maxYearBuilt",
  "minLotSize",
  "maxLotSize",
  "minDistanceToCityCenter",
  "maxDistanceToCityCenter",
  "minSchoolRating",
  "maxSchoolRating",
  "minPrice",
  "maxPrice",
];

const FEATURE_KEYS: Array<keyof HouseFeaturesVO> = [
  "squareFootage",
  "bedrooms",
  "bathrooms",
  "yearBuilt",
  "lotSize",
  "distanceToCityCenter",
  "schoolRating",
];

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function appendNumericFields(target: WhatIfBaselineQueryRequest, source: Record<string, unknown>): void {
  for (const key of BASELINE_QUERY_KEYS) {
    if (key === "filters") {
      continue;
    }

    const value = toNumber(source[key]);
    if (value !== undefined) {
      target[key] = value;
    }
  }
}

export function toWhatIfBaselineQueryRequest(filters: AnalysisFilterInput): WhatIfBaselineQueryRequest {
  const dashboard = toDashboardQueryRequest(filters);
  const range: WhatIfBaselineQueryRequest = {};

  for (const key of BASELINE_QUERY_KEYS) {
    const value = dashboard[key as keyof typeof dashboard];
    if (typeof value === "number" && Number.isFinite(value)) {
      range[key] = value;
    }
  }

  return range;
}

export function sanitizeWhatIfBaselineQueryRequest(raw: unknown): WhatIfBaselineQueryRequest {
  if (!isRecord(raw)) {
    return {};
  }

  const nestedFilters = isRecord(raw.filters) ? raw.filters : null;
  const body: WhatIfBaselineQueryRequest = {};

  appendNumericFields(body, raw);

  if (nestedFilters) {
    appendNumericFields(body, nestedFilters);
  }

  return body;
}

function normalizeHouseFeatures(raw: unknown): HouseFeaturesVO | null {
  if (!isRecord(raw)) {
    return null;
  }

  const squareFootage = toNumber(raw.squareFootage ?? raw.square_footage);
  const bedrooms = toNumber(raw.bedrooms);
  const bathrooms = toNumber(raw.bathrooms);
  const yearBuilt = toNumber(raw.yearBuilt ?? raw.year_built);
  const lotSize = toNumber(raw.lotSize ?? raw.lot_size);
  const distanceToCityCenter = toNumber(raw.distanceToCityCenter ?? raw.distance_to_city_center);
  const schoolRating = toNumber(raw.schoolRating ?? raw.school_rating);

  if (
    squareFootage === undefined ||
    bedrooms === undefined ||
    bathrooms === undefined ||
    yearBuilt === undefined ||
    lotSize === undefined ||
    distanceToCityCenter === undefined ||
    schoolRating === undefined
  ) {
    return null;
  }

  return {
    squareFootage,
    bedrooms,
    bathrooms,
    yearBuilt,
    lotSize,
    distanceToCityCenter,
    schoolRating,
  };
}

export function normalizeBaselineVO(data: unknown): BaselineVO | null {
  if (!isRecord(data)) {
    return null;
  }

  const recordCount = toNumber(data.recordCount ?? data.record_count);
  const baselinePredictedPrice = toNumber(
    data.baselinePredictedPrice ?? data.baseline_predicted_price,
  );
  const features = normalizeHouseFeatures(data.features);

  if (recordCount === undefined || baselinePredictedPrice === undefined || !features) {
    return null;
  }

  return {
    recordCount,
    features,
    baselinePredictedPrice,
  };
}

export function sanitizeScenarioPredictRequest(raw: unknown): ScenarioPredictRequest | null {
  if (!isRecord(raw)) {
    return null;
  }

  const hasFeatures = raw.features !== undefined;
  const hasFeaturesList = raw.featuresList !== undefined || raw.features_list !== undefined;

  if (hasFeatures && hasFeaturesList) {
    return null;
  }

  if (hasFeatures) {
    const features = normalizeHouseFeatures(raw.features);
    return features ? { features } : null;
  }

  if (hasFeaturesList) {
    const listRaw = raw.featuresList ?? raw.features_list;
    if (!Array.isArray(listRaw) || listRaw.length === 0) {
      return null;
    }

    const featuresList = listRaw
      .map((item) => normalizeHouseFeatures(item))
      .filter((item): item is HouseFeaturesVO => item !== null);

    if (featuresList.length !== listRaw.length) {
      return null;
    }

    return { featuresList };
  }

  return null;
}

export function normalizeScenarioPredictVO(data: unknown): ScenarioPredictVO | null {
  if (!isRecord(data)) {
    return null;
  }

  const modeRaw = data.mode;
  const mode = modeRaw === "batch" ? "batch" : modeRaw === "single" ? "single" : null;
  const count = toNumber(data.count);
  const predictionsRaw = Array.isArray(data.predictions) ? data.predictions : [];
  const predictions = predictionsRaw
    .map((value) => toNumber(value))
    .filter((value): value is number => value !== undefined);

  if (!mode || count === undefined || predictions.length === 0) {
    return null;
  }

  const predictedPrice = toNumber(data.predictedPrice ?? data.predicted_price);

  return {
    mode,
    count,
    predictedPrice: predictedPrice ?? null,
    predictions,
  };
}

export function mapBaselineVoToScenarioBaseline(
  vo: BaselineVO,
  scenarioSeedRecordId?: string,
): ScenarioBaseline {
  return {
    source: "filterMedian",
    recordCount: vo.recordCount,
    features: { ...vo.features },
    predictedPrice: vo.baselinePredictedPrice,
    scenarioSeedRecordId,
  };
}

export function extractScenarioPredictedPrice(vo: ScenarioPredictVO): number {
  if (vo.predictedPrice !== undefined && vo.predictedPrice !== null) {
    return vo.predictedPrice;
  }

  return vo.predictions[0] ?? 0;
}

export function featuresToPredictRequest(features: ValuationFeatureInput): ScenarioPredictRequest {
  return { features: { ...features } };
}

export function isValidHouseFeatures(features: HouseFeaturesVO): boolean {
  return FEATURE_KEYS.every((key) => Number.isFinite(features[key]));
}

export async function readWhatIfApiResponse<T>(response: Response): Promise<{
  code: number;
  message?: string;
  msg?: string;
  data: T | null;
}> {
  return readDashboardApiResponse<T>(response);
}

export { getDashboardApiMessage, isDashboardApiSuccess };
