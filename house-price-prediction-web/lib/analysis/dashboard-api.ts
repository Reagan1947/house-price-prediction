import type { AnalysisDashboardData, AnalysisFilterInput, AnalysisKpis } from "./types";

export type DashboardQueryRequest = {
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
  priceBucketCount?: number;
  scatterLimit?: number;
};

type DashboardMetricsVO = {
  totalRecords: number;
  avgPrice: number;
  medianPrice: number;
  avgPricePerSqFt: number;
};

type PriceDistributionPointVO = {
  bucketStart: number;
  bucketEnd: number;
  label: string;
  count: number;
};

type PriceSquareScatterPointVO = {
  squareFootage: number;
  price: number;
};

type PriceYearTrendPointVO = {
  yearBuilt: number;
  avgPrice: number;
  count: number;
};

export type DashboardVO = {
  metrics: DashboardMetricsVO;
  /** Percent change vs full-market baseline when filters are applied (from backend). */
  deltaVsBaseline?: AnalysisKpis["deltaVsBaseline"];
  priceDistribution: PriceDistributionPointVO[];
  priceSquareScatter: PriceSquareScatterPointVO[];
  priceYearTrend: PriceYearTrendPointVO[];
};

type DashboardApiResponse<T> = {
  code: number;
  message?: string;
  msg?: string;
  data: T | null;
};

const EMPTY_METRICS: DashboardMetricsVO = {
  totalRecords: 0,
  avgPrice: 0,
  medianPrice: 0,
  avgPricePerSqFt: 0,
};

const DASHBOARD_FILTER_KEYS: (keyof DashboardQueryRequest)[] = [
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

/** True when the request applies dataset filters (not just chart sizing). */
export function hasDashboardFilters(body: DashboardQueryRequest): boolean {
  return DASHBOARD_FILTER_KEYS.some((key) => body[key] !== undefined);
}

/** True when UI filters narrow the dashboard dataset (vs full market). */
export function hasAnalysisDashboardFilters(filters: AnalysisFilterInput): boolean {
  return hasDashboardFilters(toDashboardQueryRequest(filters));
}

/** Baseline query: full dataset with the same chart limits as the filtered request. */
export function toBaselineDashboardQueryRequest(body: DashboardQueryRequest): DashboardQueryRequest {
  return {
    priceBucketCount: body.priceBucketCount ?? 10,
    scatterLimit: body.scatterLimit ?? 1000,
  };
}

function percentDelta(current: number, baseline: number): number {
  return baseline === 0 ? 0 : ((current - baseline) / baseline) * 100;
}

export function computeDeltaVsBaseline(
  current: Pick<AnalysisKpis, "avgPredictedPrice" | "medianPredictedPrice" | "avgPricePerSquareFoot">,
  baseline: DashboardMetricsVO,
): AnalysisKpis["deltaVsBaseline"] {
  return {
    avgPredictedPrice: percentDelta(current.avgPredictedPrice, baseline.avgPrice),
    medianPredictedPrice: percentDelta(current.medianPredictedPrice, baseline.medianPrice),
    avgPricePerSquareFoot: percentDelta(current.avgPricePerSquareFoot, baseline.avgPricePerSqFt),
  };
}

function normalizeDeltaVsBaseline(kpis: Record<string, unknown>): AnalysisKpis["deltaVsBaseline"] {
  const source = isRecord(kpis.deltaVsBaseline) ? kpis.deltaVsBaseline : kpis;

  return {
    avgPredictedPrice: pickMetric(source, "avgPredictedPrice", "avg_predicted_price"),
    medianPredictedPrice: pickMetric(source, "medianPredictedPrice", "median_predicted_price"),
    avgPricePerSquareFoot: pickMetric(
      source,
      "avgPricePerSquareFoot",
      "avg_price_per_square_foot",
      "avgPricePerSqFt",
      "avg_price_per_sq_ft",
    ),
  };
}

function pickDeltaVsBaseline(source: Record<string, unknown>): AnalysisKpis["deltaVsBaseline"] | undefined {
  const nested = source.deltaVsBaseline ?? source.delta_vs_baseline;
  if (!isRecord(nested)) {
    return undefined;
  }

  return normalizeDeltaVsBaseline({ deltaVsBaseline: nested });
}

function appendIfDefined(
  target: DashboardQueryRequest,
  key: keyof DashboardQueryRequest,
  value: number | undefined,
): void {
  if (value !== undefined && Number.isFinite(value)) {
    target[key] = value;
  }
}

/** Maps UI filters to `DashboardQueryRequest` for POST /api/dashboard. */
export function toDashboardQueryRequest(filters: AnalysisFilterInput): DashboardQueryRequest {
  const body: DashboardQueryRequest = {
    priceBucketCount: 10,
    scatterLimit: 1000,
  };

  appendIfDefined(body, "minSquareFootage", filters.squareFootageMin);
  appendIfDefined(body, "maxSquareFootage", filters.squareFootageMax);
  appendIfDefined(body, "minBedrooms", filters.bedroomsMin);
  appendIfDefined(body, "maxBedrooms", filters.bedroomsMax);
  appendIfDefined(body, "minBathrooms", filters.bathroomsMin);
  appendIfDefined(body, "maxBathrooms", filters.bathroomsMax);
  appendIfDefined(body, "minYearBuilt", filters.yearBuiltMin);
  appendIfDefined(body, "maxYearBuilt", filters.yearBuiltMax);
  appendIfDefined(body, "minLotSize", filters.lotSizeMin);
  appendIfDefined(body, "maxLotSize", filters.lotSizeMax);
  appendIfDefined(body, "minDistanceToCityCenter", filters.distanceToCityCenterMin);
  appendIfDefined(body, "maxDistanceToCityCenter", filters.distanceToCityCenterMax);
  appendIfDefined(body, "minSchoolRating", filters.schoolRatingMin);
  appendIfDefined(body, "maxSchoolRating", filters.schoolRatingMax);
  appendIfDefined(body, "minPrice", filters.priceMin);
  appendIfDefined(body, "maxPrice", filters.priceMax);

  return body;
}

/** Keeps only documented dashboard query fields before proxying to the backend. */
export function sanitizeDashboardQueryRequest(raw: unknown): DashboardQueryRequest {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { priceBucketCount: 10, scatterLimit: 1000 };
  }

  const source = raw as Record<string, unknown>;
  const body: DashboardQueryRequest = {
    priceBucketCount: 10,
    scatterLimit: 1000,
  };

  const numericFields: (keyof DashboardQueryRequest)[] = [
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
    "priceBucketCount",
    "scatterLimit",
  ];

  for (const key of numericFields) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      body[key] = value;
    } else if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        body[key] = parsed;
      }
    }
  }

  return body;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pickArray(source: Record<string, unknown>, ...keys: string[]): unknown[] {
  for (const key of keys) {
    const value = source[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function pickMetric(source: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    if (key in source) {
      return toNumber(source[key]);
    }
  }

  return 0;
}

function normalizeDistributionPoint(point: unknown): PriceDistributionPointVO {
  if (Array.isArray(point) && point.length >= 3) {
    return {
      bucketStart: toNumber(point[0]),
      bucketEnd: toNumber(point[1]),
      label: String(point[2] ?? ""),
      count: toNumber(point[3]),
    };
  }

  if (!isRecord(point)) {
    return { bucketStart: 0, bucketEnd: 0, label: "", count: 0 };
  }

  const bucketStart = toNumber(
    point.bucketStart ?? point.bucket_start ?? point.rangeStart ?? point.range_start ?? point.min,
  );
  const bucketEnd = toNumber(point.bucketEnd ?? point.bucket_end ?? point.rangeEnd ?? point.range_end ?? point.max);

  return {
    bucketStart,
    bucketEnd,
    label: String(point.label ?? `${bucketStart}-${bucketEnd}`),
    count: toNumber(point.count),
  };
}

function normalizeScatterPoint(point: unknown): PriceSquareScatterPointVO {
  if (Array.isArray(point) && point.length >= 2) {
    return {
      squareFootage: toNumber(point[0]),
      price: toNumber(point[1]),
    };
  }

  if (!isRecord(point)) {
    return { squareFootage: 0, price: 0 };
  }

  return {
    squareFootage: toNumber(point.squareFootage ?? point.square_footage),
    price: toNumber(
      point.price ??
        point.predictedPrice ??
        point.predicted_price ??
        point.actualPrice ??
        point.actual_price,
    ),
  };
}

function normalizeYearTrendPoint(point: unknown): PriceYearTrendPointVO {
  if (Array.isArray(point) && point.length >= 2) {
    return {
      yearBuilt: toNumber(point[0]),
      avgPrice: toNumber(point[1]),
      count: toNumber(point[2]),
    };
  }

  if (!isRecord(point)) {
    return { yearBuilt: 0, avgPrice: 0, count: 0 };
  }

  return {
    yearBuilt: toNumber(point.yearBuilt ?? point.year_built ?? point.year),
    avgPrice: toNumber(point.avgPrice ?? point.avg_price ?? point.price),
    count: toNumber(point.count),
  };
}

function normalizeMetrics(source: Record<string, unknown>): DashboardMetricsVO {
  return {
    totalRecords: pickMetric(source, "totalRecords", "total_records"),
    avgPrice: pickMetric(source, "avgPrice", "avg_price"),
    medianPrice: pickMetric(source, "medianPrice", "median_price"),
    avgPricePerSqFt: pickMetric(source, "avgPricePerSqFt", "avg_price_per_sq_ft", "avgPricePerSquareFoot"),
  };
}

/** Accepts backend DashboardVO plus common nesting and snake_case variants. */
export function normalizeDashboardVo(raw: unknown): DashboardVO {
  if (!isRecord(raw)) {
    return {
      metrics: { ...EMPTY_METRICS },
      priceDistribution: [],
      priceSquareScatter: [],
      priceYearTrend: [],
    };
  }

  const nestedDashboard = isRecord(raw.dashboard) ? raw.dashboard : null;
  const nestedCharts = isRecord(raw.charts) ? raw.charts : null;
  const source = nestedDashboard ?? raw;
  const chartSource = nestedCharts ?? source;

  const metricsSource = isRecord(source.metrics)
    ? source.metrics
    : isRecord(source.kpis)
      ? source.kpis
      : source;

  const deltaVsBaseline =
    pickDeltaVsBaseline(source) ??
    pickDeltaVsBaseline(metricsSource) ??
    (nestedDashboard ? pickDeltaVsBaseline(nestedDashboard) : undefined);

  return {
    metrics: normalizeMetrics(metricsSource),
    deltaVsBaseline,
    priceDistribution: pickArray(chartSource, "priceDistribution", "price_distribution").map(
      normalizeDistributionPoint,
    ),
    priceSquareScatter: pickArray(
      chartSource,
      "priceSquareScatter",
      "price_square_scatter",
      "priceVsSquareFootage",
      "price_vs_square_footage",
    ).map(normalizeScatterPoint),
    priceYearTrend: pickArray(chartSource, "priceYearTrend", "price_year_trend", "yearBuiltTrend", "year_built_trend").map(
      normalizeYearTrendPoint,
    ),
  };
}

export function mapDashboardVoToAnalysisData(
  payload: DashboardVO,
  baselineMetrics?: DashboardMetricsVO,
): AnalysisDashboardData {
  const totalRecords = toNumber(payload.metrics?.totalRecords);
  const avgPredictedPrice = toNumber(payload.metrics?.avgPrice);
  const medianPredictedPrice = toNumber(payload.metrics?.medianPrice);
  const avgPricePerSquareFoot = toNumber(payload.metrics?.avgPricePerSqFt);
  const kpis: AnalysisKpis = {
    totalRecords,
    avgPredictedPrice,
    medianPredictedPrice,
    avgPricePerSquareFoot,
  };

  if (payload.deltaVsBaseline) {
    kpis.deltaVsBaseline = payload.deltaVsBaseline;
  } else if (baselineMetrics) {
    kpis.deltaVsBaseline = computeDeltaVsBaseline(
      { avgPredictedPrice, medianPredictedPrice, avgPricePerSquareFoot },
      baselineMetrics,
    );
  }

  return {
    kpis,
    charts: {
      priceDistribution: payload.priceDistribution.map((bucket) => ({
        label: bucket.label,
        rangeStart: bucket.bucketStart,
        rangeEnd: bucket.bucketEnd,
        count: bucket.count,
      })),
      priceVsSquareFootage: payload.priceSquareScatter
        .map((point, index) => ({
          recordId: `scatter-${index + 1}`,
          title: `${point.squareFootage} sq.ft.`,
          squareFootage: point.squareFootage,
          price: point.price,
          predictedPrice: point.price,
        }))
        .filter((point) => point.squareFootage > 0 && point.price > 0),
      yearBuiltTrend: [...payload.priceYearTrend]
        .map((point) => ({
          yearBuilt: point.yearBuilt,
          yearStart: point.yearBuilt,
          yearEnd: point.yearBuilt,
          avgPrice: point.avgPrice,
          avgPredictedPrice: point.avgPrice,
          count: point.count,
        }))
        .sort((a, b) => a.yearBuilt - b.yearBuilt),
    },
    filteredCount: totalRecords,
    totalCount: totalRecords,
  };
}

/** Maps either a backend DashboardVO or an already-mapped dashboard payload. */
export function coerceAnalysisDashboardData(raw: unknown): AnalysisDashboardData {
  if (!isRecord(raw)) {
    return mapDashboardVoToAnalysisData(normalizeDashboardVo(null));
  }

  if (isRecord(raw.charts) && isRecord(raw.kpis)) {
    const charts = raw.charts;
    const kpis = raw.kpis;
    const mappedKpis: AnalysisKpis = {
      totalRecords: pickMetric(kpis, "totalRecords"),
      avgPredictedPrice: pickMetric(kpis, "avgPredictedPrice", "avgPrice", "avg_price"),
      medianPredictedPrice: pickMetric(kpis, "medianPredictedPrice", "medianPrice", "median_price"),
      avgPricePerSquareFoot: pickMetric(kpis, "avgPricePerSquareFoot", "avgPricePerSqFt", "avg_price_per_sq_ft"),
    };

    if (isRecord(kpis.deltaVsBaseline)) {
      mappedKpis.deltaVsBaseline = normalizeDeltaVsBaseline(kpis);
    }

    return {
      kpis: mappedKpis,
      charts: {
        priceDistribution: pickArray(charts, "priceDistribution", "price_distribution").map((bucket) => {
          const normalized = normalizeDistributionPoint(bucket);
          return {
            label: normalized.label,
            rangeStart: normalized.bucketStart,
            rangeEnd: normalized.bucketEnd,
            count: normalized.count,
          };
        }),
        priceVsSquareFootage: pickArray(
          charts,
          "priceVsSquareFootage",
          "priceSquareScatter",
          "price_square_scatter",
        ).map((point, index) => {
          const normalized = normalizeScatterPoint(point);
          return {
            recordId: `scatter-${index + 1}`,
            title: `${normalized.squareFootage} sq.ft.`,
            squareFootage: normalized.squareFootage,
            price: normalized.price,
            predictedPrice: normalized.price,
          };
        })
        .filter((point) => point.squareFootage > 0 && point.price > 0),
        yearBuiltTrend: pickArray(charts, "yearBuiltTrend", "priceYearTrend", "price_year_trend")
          .map((point) => {
            const normalized = normalizeYearTrendPoint(point);
            return {
              yearBuilt: normalized.yearBuilt,
              yearStart: normalized.yearBuilt,
              yearEnd: normalized.yearBuilt,
              avgPrice: normalized.avgPrice,
              avgPredictedPrice: normalized.avgPrice,
              count: normalized.count,
            };
          })
          .sort((a, b) => a.yearBuilt - b.yearBuilt),
      },
      filteredCount: pickMetric(raw, "filteredCount", "filtered_count") || pickMetric(raw.kpis, "totalRecords"),
      totalCount: pickMetric(raw, "totalCount", "total_count") || pickMetric(raw.kpis, "totalRecords"),
      performanceWarning: typeof raw.performanceWarning === "string" ? raw.performanceWarning : undefined,
    };
  }

  return mapDashboardVoToAnalysisData(normalizeDashboardVo(raw));
}

/** Removes market-baseline deltas when the dashboard query is unfiltered. */
export function stripDashboardBaselineDelta(data: AnalysisDashboardData): AnalysisDashboardData {
  if (!data.kpis.deltaVsBaseline) {
    return data;
  }

  const { deltaVsBaseline: _removed, ...kpis } = data.kpis;

  return {
    ...data,
    kpis,
  };
}

/** Applies market-baseline deltas when filtered metrics and unfiltered baseline are both available. */
export function applyBaselineDeltaToDashboardData(
  data: AnalysisDashboardData,
  baselineMetrics: DashboardMetricsVO | undefined,
): AnalysisDashboardData {
  if (data.kpis.deltaVsBaseline) {
    return data;
  }

  if (!baselineMetrics) {
    return stripDashboardBaselineDelta(data);
  }

  return {
    ...data,
    kpis: {
      ...data.kpis,
      deltaVsBaseline: computeDeltaVsBaseline(data.kpis, baselineMetrics),
    },
  };
}

export async function readDashboardApiResponse<T>(response: Response): Promise<DashboardApiResponse<T>> {
  const text = await response.text();

  if (!text) {
    return {
      code: response.status,
      message: response.statusText || "Request failed",
      data: null,
    };
  }

  try {
    return JSON.parse(text) as DashboardApiResponse<T>;
  } catch {
    return {
      code: response.status,
      message: response.statusText || "Request failed",
      data: null,
    };
  }
}

export function isDashboardApiSuccess(code: number): boolean {
  return code === 0 || code === 200;
}

export function getDashboardApiMessage(payload: DashboardApiResponse<unknown>): string {
  return payload.message ?? payload.msg ?? "Request failed";
}
