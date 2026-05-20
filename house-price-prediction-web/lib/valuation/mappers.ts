import type {
  CreatePredictionHistoryPayload,
  HouseFeaturesPayload,
  PredictionHistoryPayload,
  PredictResultPayload,
} from "./api-types";
import type {
  PredictionCreatePayload,
  PredictionListQuery,
  PredictionRecord,
  ValuationFeatureInput,
  ValuationTab,
} from "./types";

const TAB_SET = new Set<ValuationTab>(["prediction", "history", "comparison"]);

type NormalizeTabInput = {
  tab?: string | null;
  mode?: string | null;
  view?: string | null;
};

export function normalizeTab(input: NormalizeTabInput): ValuationTab {
  if (input.tab && TAB_SET.has(input.tab as ValuationTab)) {
    return input.tab as ValuationTab;
  }

  if (input.mode === "analysis") {
    return "comparison";
  }

  if (input.view === "compare") {
    return "comparison";
  }

  return "prediction";
}

export function toHouseFeaturesPayload(features: ValuationFeatureInput): HouseFeaturesPayload {
  return {
    square_footage: features.squareFootage,
    bedrooms: features.bedrooms,
    bathrooms: features.bathrooms,
    year_built: features.yearBuilt,
    lot_size: features.lotSize,
    distance_to_city_center: features.distanceToCityCenter,
    school_rating: features.schoolRating,
  };
}

export function toCreatePredictionHistoryPayload(
  payload: PredictionCreatePayload,
): CreatePredictionHistoryPayload {
  return {
    title: payload.title.trim() || null,
    location: payload.location.trim() || null,
    ...toHouseFeaturesPayload(payload.features),
    predicted_price: payload.predictedPrice,
  };
}

export function fromPredictionHistoryPayload(payload: PredictionHistoryPayload): PredictionRecord {
  return {
    id: String(payload.id),
    title: payload.title ?? "",
    location: payload.location ?? "",
    features: {
      squareFootage: payload.square_footage,
      bedrooms: payload.bedrooms,
      bathrooms: payload.bathrooms,
      yearBuilt: payload.year_built,
      lotSize: payload.lot_size,
      distanceToCityCenter: payload.distance_to_city_center,
      schoolRating: payload.school_rating,
    },
    predictedPrice: payload.predicted_price,
    predictedAt: payload.predicted_at,
    createdAt: payload.created_at,
    updatedAt: payload.updated_at,
  };
}

export function parsePredictResultPrice(data: PredictResultPayload | null): number {
  if (!data) {
    throw new Error("Prediction response is empty.");
  }

  if (typeof data.prediction === "number" && Number.isFinite(data.prediction)) {
    return data.prediction;
  }

  const first = data.predictions?.[0];
  if (typeof first === "number" && Number.isFinite(first)) {
    return first;
  }

  throw new Error("Prediction response is invalid.");
}

export function buildPredictionListSearchParams(query?: PredictionListQuery): URLSearchParams {
  const params = new URLSearchParams({
    page: String(query?.page ?? 1),
    size: String(query?.size ?? 100),
  });

  if (query?.keyword?.trim()) {
    params.set("keyword", query.keyword.trim());
  }

  if (query?.location?.trim()) {
    params.set("location", query.location.trim());
  }

  if (typeof query?.minPrice === "number") {
    params.set("predicted_price_min", String(query.minPrice));
  }

  if (typeof query?.maxPrice === "number") {
    params.set("predicted_price_max", String(query.maxPrice));
  }

  return params;
}

export function toChartFeatureRows(features: ValuationFeatureInput): Array<{ key: keyof ValuationFeatureInput; value: number }> {
  return [
    { key: "squareFootage", value: features.squareFootage },
    { key: "bedrooms", value: features.bedrooms },
    { key: "bathrooms", value: features.bathrooms },
    { key: "yearBuilt", value: features.yearBuilt },
    { key: "lotSize", value: features.lotSize },
    { key: "distanceToCityCenter", value: features.distanceToCityCenter },
    { key: "schoolRating", value: features.schoolRating },
  ];
}
