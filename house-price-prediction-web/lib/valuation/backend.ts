import {
  getApiResponseStatus,
  getAuthTokenFromCookies,
  getBackendApiUrl,
  getBearerAuthHeaders,
  readBackendApiResponse,
  type ApiResponse,
} from "@/lib/auth/session";
import type {
  CreatePredictionHistoryPayload,
  PredictionHistoryPagePayload,
  PredictionHistoryPayload,
  PredictResultPayload,
} from "./api-types";
import { isPredictionHistoryUnavailable, PREDICTION_HISTORY_UNAVAILABLE_MSG } from "./api-helpers";
import { ValuationApiError } from "./errors";
import {
  buildPredictionListSearchParams,
  fromPredictionHistoryPayload,
  parsePredictResultPrice,
  toCreatePredictionHistoryPayload,
  toHouseFeaturesPayload,
} from "./mappers";
import type {
  PredictionCreatePayload,
  PredictionListQuery,
  PredictionListResult,
  PredictionRecord,
  ValuationFeatureInput,
} from "./types";

async function getRequiredAuthToken(): Promise<string> {
  const token = await getAuthTokenFromCookies();

  if (!token) {
    throw new ValuationApiError(401, "Not Authenticated");
  }

  return token;
}

type BackendRequestResult<T> = {
  status: number;
  payload: ApiResponse<T>;
};

async function requestBackend<T>(path: string, init: RequestInit = {}): Promise<BackendRequestResult<T>> {
  const token = await getRequiredAuthToken();
  const headers = new Headers(init.headers);
  const bearerHeaders = getBearerAuthHeaders(token);

  if (typeof bearerHeaders === "object" && bearerHeaders !== null && !Array.isArray(bearerHeaders)) {
    for (const [key, value] of Object.entries(bearerHeaders)) {
      if (typeof value === "string") {
        headers.set(key, value);
      }
    }
  }

  const response = await fetch(getBackendApiUrl(path), {
    ...init,
    headers,
    cache: "no-store",
  });
  const payload = await readBackendApiResponse<T>(response);

  return {
    status: getApiResponseStatus(response.status, payload),
    payload,
  };
}

async function requestPublicBackend<T>(path: string, init: RequestInit = {}): Promise<BackendRequestResult<T>> {
  const response = await fetch(getBackendApiUrl(path), {
    ...init,
    cache: "no-store",
  });
  const payload = await readBackendApiResponse<T>(response);

  return {
    status: getApiResponseStatus(response.status, payload),
    payload,
  };
}

function assertSuccess<T>(status: number, payload: ApiResponse<T>): T {
  if (status !== 200 || payload.code !== 200 || payload.data === null) {
    throw new ValuationApiError(payload.code || status, payload.msg || "Request failed");
  }

  return payload.data;
}

export async function predictPriceFromBackend(features: ValuationFeatureInput): Promise<number> {
  const { status, payload } = await requestPublicBackend<PredictResultPayload>("/predict", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(toHouseFeaturesPayload(features)),
  });

  const data = assertSuccess(status, payload);
  return parsePredictResultPrice(data);
}

export async function listPredictionsFromBackend(
  query?: PredictionListQuery,
): Promise<PredictionListResult & { historyUnavailable?: boolean }> {
  const search = buildPredictionListSearchParams(query).toString();
  const { status, payload } = await requestBackend<PredictionHistoryPagePayload>(`/predictions?${search}`);

  if (isPredictionHistoryUnavailable(status, payload)) {
    return {
      items: [],
      total: 0,
      page: query?.page ?? 1,
      size: query?.size ?? 100,
      totalPages: 0,
      historyUnavailable: true,
    };
  }

  const data = assertSuccess(status, payload);

  return {
    items: data.items.map(fromPredictionHistoryPayload),
    total: data.total,
    page: data.page,
    size: data.size,
    totalPages: data.total_pages,
  };
}

export async function getPredictionFromBackend(id: string): Promise<PredictionRecord | null> {
  const { status, payload } = await requestBackend<PredictionHistoryPayload>(`/predictions/${id}`);

  if (status === 404 || payload.code === 404) {
    return null;
  }

  if (status !== 200 || payload.data === null) {
    throw new ValuationApiError(payload.code || status, payload.msg || "Request failed");
  }

  return fromPredictionHistoryPayload(payload.data);
}

export async function createPredictionFromBackend(
  input: PredictionCreatePayload,
): Promise<PredictionRecord> {
  const body: CreatePredictionHistoryPayload = toCreatePredictionHistoryPayload(input);
  const { status, payload } = await requestBackend<PredictionHistoryPayload>("/predictions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (isPredictionHistoryUnavailable(status, payload)) {
    throw new ValuationApiError(404, PREDICTION_HISTORY_UNAVAILABLE_MSG);
  }

  const data = assertSuccess(status, payload);
  return fromPredictionHistoryPayload(data);
}

export async function deletePredictionFromBackend(id: string): Promise<void> {
  const { status, payload } = await requestBackend<null>(`/predictions/${id}`, {
    method: "DELETE",
  });

  if (isPredictionHistoryUnavailable(status, payload)) {
    throw new ValuationApiError(404, PREDICTION_HISTORY_UNAVAILABLE_MSG);
  }

  if (status !== 200 || payload.code !== 200) {
    throw new ValuationApiError(payload.code || status, payload.msg || "Request failed");
  }
}

export async function repredictPredictionFromBackend(id: string): Promise<PredictionRecord> {
  const { status, payload } = await requestBackend<PredictionHistoryPayload>(`/predictions/${id}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
  const data = assertSuccess(status, payload);
  return fromPredictionHistoryPayload(data);
}
