import type { AnalysisFilterInput, AnalysisSegmentGroupKey, AnalysisSegmentRow, AnalysisSegmentsResult } from "./types";
import { buildSegmentFilterPatch } from "./segment-buckets";
import { toDashboardQueryRequest } from "./dashboard-api";
import {
  getDashboardApiMessage,
  isDashboardApiSuccess,
  readDashboardApiResponse,
} from "./dashboard-api";

export const SEGMENT_DIMENSIONS = new Set<AnalysisSegmentGroupKey>([
  "bedrooms",
  "bathrooms",
  "year_built_decade",
  "school_rating_band",
  "distance_band",
]);

export type SegmentQueryRequest = {
  segmentDimension: AnalysisSegmentGroupKey;
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
  filters?: Partial<SegmentQueryRequest>;
};

export type SegmentGroupRowVO = {
  group: string;
  groupKey: string;
  count: number;
  median: number;
  mean: number;
  p25: number;
  p75: number;
  stdDev: number;
};

export type SegmentTableVO = {
  segmentDimension: AnalysisSegmentGroupKey;
  rows: SegmentGroupRowVO[];
};

export type SegmentChartPointVO = {
  group: string;
  groupKey: string;
  count: number;
  medianPrice: number;
};

export type SegmentChartVO = {
  segmentDimension: AnalysisSegmentGroupKey;
  points: SegmentChartPointVO[];
};

const SEGMENT_QUERY_KEYS: (keyof SegmentQueryRequest)[] = [
  "segmentDimension",
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

function appendNumericFields(target: SegmentQueryRequest, source: Record<string, unknown>): void {
  for (const key of SEGMENT_QUERY_KEYS) {
    if (key === "segmentDimension" || key === "filters") {
      continue;
    }

    const value = toNumber(source[key]);
    if (value !== undefined) {
      target[key] = value;
    }
  }
}

export function sanitizeSegmentQueryRequest(raw: unknown): SegmentQueryRequest | null {
  if (!isRecord(raw)) {
    return null;
  }

  const nestedFilters = isRecord(raw.filters) ? raw.filters : null;
  const segmentRaw = raw.segmentDimension ?? nestedFilters?.segmentDimension;

  if (typeof segmentRaw !== "string" || !SEGMENT_DIMENSIONS.has(segmentRaw as AnalysisSegmentGroupKey)) {
    return null;
  }

  const body: SegmentQueryRequest = {
    segmentDimension: segmentRaw as AnalysisSegmentGroupKey,
  };

  appendNumericFields(body, raw);

  if (nestedFilters) {
    appendNumericFields(body, nestedFilters);
    if (
      typeof nestedFilters.segmentDimension === "string" &&
      SEGMENT_DIMENSIONS.has(nestedFilters.segmentDimension as AnalysisSegmentGroupKey) &&
      !raw.segmentDimension
    ) {
      body.segmentDimension = nestedFilters.segmentDimension as AnalysisSegmentGroupKey;
    }
  }

  return body;
}

export function toSegmentQueryRequest(
  filters: AnalysisFilterInput,
  segmentDimension: AnalysisSegmentGroupKey,
): SegmentQueryRequest {
  const dashboard = toDashboardQueryRequest(filters);
  const range: SegmentQueryRequest = { segmentDimension };

  for (const key of SEGMENT_QUERY_KEYS) {
    if (key === "segmentDimension" || key === "filters") {
      continue;
    }

    const value = dashboard[key as keyof typeof dashboard];
    if (typeof value === "number" && Number.isFinite(value)) {
      range[key] = value;
    }
  }

  return range;
}

function normalizeSegmentRow(row: unknown): SegmentGroupRowVO | null {
  if (!isRecord(row)) {
    return null;
  }

  const groupKey = String(row.groupKey ?? row.group_key ?? "");
  if (!groupKey) {
    return null;
  }

  return {
    group: String(row.group ?? groupKey),
    groupKey,
    count: toNumber(row.count) ?? 0,
    median: toNumber(row.median) ?? 0,
    mean: toNumber(row.mean) ?? 0,
    p25: toNumber(row.p25) ?? 0,
    p75: toNumber(row.p75) ?? 0,
    stdDev: toNumber(row.stdDev ?? row.std_dev) ?? 0,
  };
}

function normalizeChartPoint(point: unknown): SegmentChartPointVO | null {
  if (!isRecord(point)) {
    return null;
  }

  const groupKey = String(point.groupKey ?? point.group_key ?? "");
  if (!groupKey) {
    return null;
  }

  return {
    group: String(point.group ?? groupKey),
    groupKey,
    count: toNumber(point.count) ?? 0,
    medianPrice: toNumber(point.medianPrice ?? point.median_price ?? point.median) ?? 0,
  };
}

export function normalizeSegmentTableVO(data: unknown): SegmentTableVO | null {
  if (!isRecord(data)) {
    return null;
  }

  const segmentDimension = data.segmentDimension ?? data.segment_dimension;
  if (typeof segmentDimension !== "string" || !SEGMENT_DIMENSIONS.has(segmentDimension as AnalysisSegmentGroupKey)) {
    return null;
  }

  const rowsRaw = Array.isArray(data.rows) ? data.rows : [];
  const rows = rowsRaw
    .map((row) => normalizeSegmentRow(row))
    .filter((row): row is SegmentGroupRowVO => row !== null);

  return {
    segmentDimension: segmentDimension as AnalysisSegmentGroupKey,
    rows,
  };
}

export function normalizeSegmentChartVO(data: unknown): SegmentChartVO | null {
  if (!isRecord(data)) {
    return null;
  }

  const segmentDimension = data.segmentDimension ?? data.segment_dimension;
  if (typeof segmentDimension !== "string" || !SEGMENT_DIMENSIONS.has(segmentDimension as AnalysisSegmentGroupKey)) {
    return null;
  }

  const pointsRaw = Array.isArray(data.points) ? data.points : [];
  const points = pointsRaw
    .map((point) => normalizeChartPoint(point))
    .filter((point): point is SegmentChartPointVO => point !== null);

  return {
    segmentDimension: segmentDimension as AnalysisSegmentGroupKey,
    points,
  };
}

export function mapSegmentRowsToAnalysis(
  table: SegmentTableVO,
  chart: SegmentChartVO,
): AnalysisSegmentRow[] {
  const chartByKey = new Map(chart.points.map((point) => [point.groupKey, point]));

  return table.rows.map((row) => {
    const chartPoint = chartByKey.get(row.groupKey);

    if (chartPoint && chartPoint.count !== row.count) {
      throw new Error(`Segment count mismatch for group ${row.groupKey}.`);
    }

    if (chartPoint && Math.abs(chartPoint.medianPrice - row.median) > 0.01) {
      throw new Error(`Segment median mismatch for group ${row.groupKey}.`);
    }

    return {
      id: row.groupKey,
      group: row.group,
      count: row.count,
      median: row.median,
      mean: row.mean,
      p25: row.p25,
      p75: row.p75,
      stdDev: row.stdDev,
      filterPatch: buildSegmentFilterPatch(table.segmentDimension, row.groupKey),
    };
  });
}

export function mapSegmentsApiToResult(
  table: SegmentTableVO,
  chart: SegmentChartVO,
  totalCount: number,
): AnalysisSegmentsResult {
  if (table.segmentDimension !== chart.segmentDimension) {
    throw new Error("Segment table and chart dimensions do not match.");
  }

  const tableKeys = new Set(table.rows.map((row) => row.groupKey));
  const chartKeys = new Set(chart.points.map((point) => point.groupKey));

  if (tableKeys.size !== chartKeys.size) {
    throw new Error("Segment table and chart group sets do not match.");
  }

  for (const key of tableKeys) {
    if (!chartKeys.has(key)) {
      throw new Error(`Missing chart point for group ${key}.`);
    }
  }

  const rows = mapSegmentRowsToAnalysis(table, chart);
  const filteredCount = rows.reduce((sum, row) => sum + row.count, 0);

  return {
    groupBy: table.segmentDimension,
    rows,
    filteredCount,
    totalCount,
  };
}

export { getSegmentsChartApiUrl, getSegmentsTableApiUrl } from "./segments-config";

export async function readSegmentsApiResponse<T>(response: Response): Promise<{
  code: number;
  message?: string;
  msg?: string;
  data: T | null;
}> {
  return readDashboardApiResponse<T>(response);
}

export { getDashboardApiMessage, isDashboardApiSuccess };
