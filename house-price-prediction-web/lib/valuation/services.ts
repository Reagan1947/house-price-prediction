import { readApiResponse, type ApiResponse } from "@/lib/api/response";
import type {
  PredictResultPayload,
  PredictionHistoryPagePayload,
  PredictionHistoryPayload,
} from "./api-types";
import { isPredictionHistoryUnavailable, PREDICTION_HISTORY_UNAVAILABLE_MSG } from "./api-helpers";
import { buildComparisonSeries } from "./compare-mappers";
import { ValuationApiError } from "./errors";
import {
  buildPredictionListSearchParams,
  fromPredictionHistoryPayload,
  parsePredictResultPrice,
  toCreatePredictionHistoryPayload,
  toHouseFeaturesPayload,
} from "./mappers";
import type {
  ComparisonSeries,
  PredictionCreatePayload,
  PredictionListQuery,
  PredictionListResult,
  PredictionRecord,
  ValuationFeatureInput,
} from "./types";

function assertClientSuccess<T>(response: Response, payload: ApiResponse<T>): T {
  if (!response.ok || payload.code !== 200 || payload.data === null) {
    throw new ValuationApiError(payload.code || response.status, payload.msg || "Request failed");
  }

  return payload.data;
}

export async function predictValuationPrice(features: ValuationFeatureInput): Promise<number> {
  const response = await fetch("/api/predict", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(toHouseFeaturesPayload(features)),
    cache: "no-store",
  });
  const payload = await readApiResponse<PredictResultPayload>(response);
  const data = assertClientSuccess(response, payload);
  return parsePredictResultPrice(data);
}

export async function getPredictions(
  query?: PredictionListQuery,
): Promise<PredictionListResult & { historyUnavailable?: boolean }> {
  const search = buildPredictionListSearchParams(query).toString();
  const response = await fetch(`/api/predictions?${search}`, {
    method: "GET",
    cache: "no-store",
  });
  const payload = await readApiResponse<PredictionHistoryPagePayload>(response);

  if (isPredictionHistoryUnavailable(response.status, payload)) {
    return {
      items: [],
      total: 0,
      page: query?.page ?? 1,
      size: query?.size ?? 100,
      totalPages: 0,
      historyUnavailable: true,
    };
  }

  const data = assertClientSuccess(response, payload);

  return {
    items: data.items.map(fromPredictionHistoryPayload),
    total: data.total,
    page: data.page,
    size: data.size,
    totalPages: data.total_pages,
  };
}

export async function getPredictionById(id: string): Promise<PredictionRecord | null> {
  const response = await fetch(`/api/predictions/${id}`, {
    method: "GET",
    cache: "no-store",
  });
  const payload = await readApiResponse<PredictionHistoryPayload>(response);

  if (response.status === 404 || payload.code === 404) {
    return null;
  }

  const data = assertClientSuccess(response, payload);
  return fromPredictionHistoryPayload(data);
}

export async function createPrediction(payload: PredictionCreatePayload): Promise<PredictionRecord> {
  const response = await fetch("/api/predictions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(toCreatePredictionHistoryPayload(payload)),
    cache: "no-store",
  });
  const apiPayload = await readApiResponse<PredictionHistoryPayload>(response);

  if (isPredictionHistoryUnavailable(response.status, apiPayload)) {
    throw new ValuationApiError(404, PREDICTION_HISTORY_UNAVAILABLE_MSG);
  }

  const data = assertClientSuccess(response, apiPayload);
  return fromPredictionHistoryPayload(data);
}

export async function deletePrediction(id: string): Promise<void> {
  const response = await fetch(`/api/predictions/${id}`, {
    method: "DELETE",
    cache: "no-store",
  });
  const payload = await readApiResponse<null>(response);

  if (isPredictionHistoryUnavailable(response.status, payload)) {
    throw new ValuationApiError(404, PREDICTION_HISTORY_UNAVAILABLE_MSG);
  }

  if (!response.ok || payload.code !== 200) {
    throw new ValuationApiError(payload.code || response.status, payload.msg || "Request failed");
  }
}

export async function getComparisonSeries(recordIds: string[]): Promise<ComparisonSeries[]> {
  const uniqueRecordIds = Array.from(new Set(recordIds));
  const { items } = await getPredictions({ size: 100 });

  return buildComparisonSeries(items, uniqueRecordIds);
}
