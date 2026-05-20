import { readApiResponse, type ApiResponse } from "@/lib/api/response";
import { ValuationApiError } from "@/lib/valuation/errors";
import { loadAllPredictionRecords } from "./prediction-loader";
import { getPredictions } from "@/lib/valuation/services";
import type { PredictionRecord, ValuationFeatureInput } from "@/lib/valuation/types";
import { buildAnalysisRecords, filterAnalysisRecords } from "./aggregators";
import { coerceAnalysisDashboardData, toDashboardQueryRequest } from "./dashboard-api";
import { serializeAnalysisFilters } from "./filters";
import {
  mapSegmentsApiToResult,
  normalizeSegmentChartVO,
  normalizeSegmentTableVO,
  toSegmentQueryRequest,
} from "./segments-api";
import { buildScenarioResult } from "./scenarios";
import {
  extractScenarioPredictedPrice,
  featuresToPredictRequest,
  mapBaselineVoToScenarioBaseline,
  normalizeBaselineVO,
  normalizeScenarioPredictVO,
  toWhatIfBaselineQueryRequest,
} from "./what-if-api";
import type {
  AnalysisDashboardData,
  AnalysisFilterInput,
  AnalysisRecordsResult,
  AnalysisSegmentGroupKey,
  AnalysisSegmentsResult,
  ScenarioBaseline,
  ScenarioResult,
} from "./types";

function buildAnalysisQuery(filters: AnalysisFilterInput): string {
  return serializeAnalysisFilters(filters).toString();
}

async function fetchDashboard(filters: AnalysisFilterInput): Promise<AnalysisDashboardData> {
  const response = await fetch("/api/dashboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toDashboardQueryRequest(filters)),
    cache: "no-store",
  });

  const payload = await readApiResponse<AnalysisDashboardData>(response);
  if (!response.ok || payload.code !== 200 || !payload.data) {
    throw new ValuationApiError(
      payload.code || response.status,
      payload.msg || "Failed to load dashboard data.",
    );
  }

  return coerceAnalysisDashboardData(payload.data);
}

async function tryFetchRecords(filters: AnalysisFilterInput): Promise<AnalysisRecordsResult | null> {
  try {
    const query = buildAnalysisQuery(filters);
    const response = await fetch(`/api/analysis/records?${query}`, {
      method: "GET",
      cache: "no-store",
    });

    if (response.status === 404) {
      return null;
    }

    const payload = await readApiResponse<AnalysisRecordsResult>(response);
    if (!response.ok || payload.code !== 200 || !payload.data) {
      return null;
    }

    return payload.data;
  } catch {
    return null;
  }
}

async function loadAllPredictions(): Promise<PredictionRecord[]> {
  const result = await loadAllPredictionRecords(getPredictions);
  return result.items;
}

export async function getAnalysisDashboard(filters: AnalysisFilterInput): Promise<AnalysisDashboardData> {
  return fetchDashboard(filters);
}

export async function getAnalysisRecords(filters: AnalysisFilterInput): Promise<AnalysisRecordsResult> {
  const remote = await tryFetchRecords(filters);
  if (remote) {
    return remote;
  }

  const records = await loadAllPredictions();
  return buildAnalysisRecords(records, filters);
}

async function fetchSegmentTotalCount(): Promise<number> {
  try {
    const response = await fetch("/api/segments/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    const payload = await readApiResponse<{ totalRecords: number }>(response);
    if (!response.ok || payload.code !== 200 || !payload.data) {
      return 0;
    }

    return payload.data.totalRecords;
  } catch {
    return 0;
  }
}

async function fetchSegmentsFromApi(
  filters: AnalysisFilterInput,
  groupBy: AnalysisSegmentGroupKey,
): Promise<AnalysisSegmentsResult> {
  const body = toSegmentQueryRequest(filters, groupBy);

  const [tableResponse, chartResponse] = await Promise.all([
    fetch("/api/segments/table", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    }),
    fetch("/api/segments/chart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    }),
  ]);

  if (tableResponse.status === 404 || chartResponse.status === 404) {
    throw new ValuationApiError(404, "Segments API is not available.");
  }

  const tablePayload = await readApiResponse<unknown>(tableResponse);
  const chartPayload = await readApiResponse<unknown>(chartResponse);

  if (tableResponse.status === 401 || chartResponse.status === 401) {
    throw new ValuationApiError(401, tablePayload.msg || chartPayload.msg || "Not Authenticated");
  }

  if (tableResponse.status === 400 || chartResponse.status === 400) {
    throw new ValuationApiError(400, tablePayload.msg || "Invalid segment parameters.");
  }

  if (
    !tableResponse.ok ||
    !chartResponse.ok ||
    tablePayload.code !== 200 ||
    chartPayload.code !== 200 ||
    !tablePayload.data ||
    !chartPayload.data
  ) {
    throw new ValuationApiError(
      tablePayload.code || tableResponse.status,
      tablePayload.msg || chartPayload.msg || "Failed to load segment data.",
    );
  }

  const table = normalizeSegmentTableVO(tablePayload.data);
  const chart = normalizeSegmentChartVO(chartPayload.data);

  if (!table || !chart) {
    throw new ValuationApiError(500, "Invalid segment response format.");
  }

  try {
    const totalCount = await fetchSegmentTotalCount();
    return mapSegmentsApiToResult(table, chart, totalCount);
  } catch (error) {
    if (error instanceof ValuationApiError) {
      throw error;
    }

    throw new ValuationApiError(
      500,
      error instanceof Error ? error.message : "Failed to load segment data.",
    );
  }
}

export async function getAnalysisSegments(
  filters: AnalysisFilterInput,
  groupBy: AnalysisSegmentGroupKey,
): Promise<AnalysisSegmentsResult> {
  return fetchSegmentsFromApi(filters, groupBy);
}

export async function getFilteredAnalysisRecords(filters: AnalysisFilterInput): Promise<PredictionRecord[]> {
  const records = await loadAllPredictions();
  return filterAnalysisRecords(
    records.filter((record) => record.predictedPrice !== null),
    filters,
  );
}

export async function fetchWhatIfBaseline(
  filters: AnalysisFilterInput,
  scenarioSeedRecordId?: string,
): Promise<ScenarioBaseline> {
  const body = toWhatIfBaselineQueryRequest(filters);
  const response = await fetch("/api/what-if/baseline", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const payload = await readApiResponse<unknown>(response);

  if (response.status === 401 || payload.code === 401) {
    throw new ValuationApiError(401, payload.msg || "Not Authenticated");
  }

  if (response.status === 400 || payload.code === 400) {
    throw new ValuationApiError(400, payload.msg || "Unable to compute baseline for the current filters.");
  }

  if (!response.ok || payload.code !== 200 || !payload.data) {
    throw new ValuationApiError(
      payload.code || response.status,
      payload.msg || "Failed to load baseline.",
    );
  }

  const vo = normalizeBaselineVO(payload.data);
  if (!vo) {
    throw new ValuationApiError(500, "Invalid baseline response format.");
  }

  return mapBaselineVoToScenarioBaseline(vo, scenarioSeedRecordId);
}

export async function predictScenario(features: ValuationFeatureInput): Promise<number> {
  const response = await fetch("/api/what-if/scenarios/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(featuresToPredictRequest(features)),
    cache: "no-store",
  });

  const payload = await readApiResponse<unknown>(response);

  if (response.status === 401 || payload.code === 401) {
    throw new ValuationApiError(401, payload.msg || "Not Authenticated");
  }

  if (response.status === 400 || payload.code === 400) {
    throw new ValuationApiError(400, payload.msg || "Invalid scenario features.");
  }

  if (!response.ok || payload.code !== 200 || !payload.data) {
    throw new ValuationApiError(
      payload.code || response.status,
      payload.msg || "Failed to run scenario.",
    );
  }

  const vo = normalizeScenarioPredictVO(payload.data);
  if (!vo) {
    throw new ValuationApiError(500, "Invalid scenario predict response format.");
  }

  return extractScenarioPredictedPrice(vo);
}

export async function runScenario(
  baseline: ScenarioBaseline,
  features: ValuationFeatureInput,
): Promise<ScenarioResult> {
  try {
    const scenarioPrice = await predictScenario(features);
    return buildScenarioResult(baseline, features, scenarioPrice);
  } catch (error) {
    if (error instanceof ValuationApiError) {
      throw error;
    }

    throw new ValuationApiError(500, "Failed to run scenario. Please retry.");
  }
}

export async function fetchAnalysisApiHealth(): Promise<boolean> {
  const response = await fetch("/api/dashboard", { method: "HEAD", cache: "no-store" });
  return response.ok;
}

export type { ApiResponse };
