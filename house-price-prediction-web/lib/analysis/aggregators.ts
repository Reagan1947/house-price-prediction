import type { PredictionRecord } from "@/lib/valuation/types";
import { hasAnalysisDashboardFilters } from "./dashboard-api";
import { inferPropertyType } from "./property-type";
import { getSegmentBucket, type SegmentBucket } from "./segment-buckets";
import type {
  AnalysisCharts,
  AnalysisDashboardData,
  AnalysisFilterInput,
  AnalysisHistogramBucket,
  AnalysisKpis,
  AnalysisRecordsResult,
  AnalysisSegmentGroupKey,
  AnalysisSegmentRow,
  AnalysisSegmentsResult,
  AnalysisScatterPoint,
  AnalysisYearBucket,
} from "./types";

const PERFORMANCE_WARNING_THRESHOLD = 5000;
const DEFAULT_PAGE_SIZE = 20;

function inRange(value: number, min?: number, max?: number): boolean {
  if (min !== undefined && value < min) {
    return false;
  }

  if (max !== undefined && value > max) {
    return false;
  }

  return true;
}

function normalizeRegion(location: string): string {
  const trimmed = location.trim();
  if (!trimmed) {
    return "Unknown";
  }

  const parts = trimmed.split(",").map((part) => part.trim()).filter(Boolean);
  return parts[parts.length - 1] || trimmed;
}

export function filterAnalysisRecords(
  records: PredictionRecord[],
  filters: AnalysisFilterInput,
): PredictionRecord[] {
  const keyword = filters.keyword?.trim().toLowerCase() ?? "";
  const regions = filters.region?.map((item) => item.toLowerCase()) ?? [];

  return records.filter((record) => {
    if (record.predictedPrice === null) {
      return false;
    }

    if (keyword.length > 0) {
      const haystack = `${record.id} ${record.title} ${record.location}`.toLowerCase();
      if (!haystack.includes(keyword)) {
        return false;
      }
    }

    if (regions.length > 0) {
      const location = record.location.toLowerCase();
      const region = normalizeRegion(record.location).toLowerCase();
      const matches = regions.some((item) => location.includes(item) || region.includes(item));
      if (!matches) {
        return false;
      }
    }

    if (filters.propertyType && inferPropertyType(record) !== filters.propertyType) {
      return false;
    }

    if (!inRange(record.features.squareFootage, filters.squareFootageMin, filters.squareFootageMax)) {
      return false;
    }

    if (!inRange(record.features.bedrooms, filters.bedroomsMin, filters.bedroomsMax)) {
      return false;
    }

    if (!inRange(record.features.bathrooms, filters.bathroomsMin, filters.bathroomsMax)) {
      return false;
    }

    if (!inRange(record.features.yearBuilt, filters.yearBuiltMin, filters.yearBuiltMax)) {
      return false;
    }

    if (!inRange(record.features.lotSize, filters.lotSizeMin, filters.lotSizeMax)) {
      return false;
    }

    if (
      !inRange(
        record.features.distanceToCityCenter,
        filters.distanceToCityCenterMin,
        filters.distanceToCityCenterMax,
      )
    ) {
      return false;
    }

    if (!inRange(record.predictedPrice, filters.priceMin, filters.priceMax)) {
      return false;
    }

    if (!inRange(record.features.schoolRating, filters.schoolRatingMin, filters.schoolRatingMax)) {
      return false;
    }

    return true;
  });
}

function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }

  return sorted[mid];
}

function quantile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) {
    return 0;
  }

  if (sortedValues.length === 1) {
    return sortedValues[0];
  }

  const index = (sortedValues.length - 1) * percentile;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

function buildSegmentStats(
  id: string,
  group: string,
  prices: number[],
  filterPatch: Partial<AnalysisFilterInput>,
): AnalysisSegmentRow {
  const sortedPrices = [...prices].sort((a, b) => a - b);
  const count = sortedPrices.length;
  const mean = count > 0 ? sortedPrices.reduce((sum, value) => sum + value, 0) / count : 0;
  const variance =
    count > 0
      ? sortedPrices.reduce((sum, value) => sum + (value - mean) ** 2, 0) / count
      : 0;

  return {
    id,
    group,
    count,
    median: quantile(sortedPrices, 0.5),
    mean,
    p25: quantile(sortedPrices, 0.25),
    p75: quantile(sortedPrices, 0.75),
    stdDev: Math.sqrt(variance),
    filterPatch,
  };
}

function computeKpis(
  records: PredictionRecord[],
  baselineRecords: PredictionRecord[],
  includeBaselineDelta: boolean,
): AnalysisKpis {
  const prices = records.map((record) => record.predictedPrice as number);
  const totalRecords = records.length;
  const avgPredictedPrice =
    totalRecords > 0 ? prices.reduce((sum, value) => sum + value, 0) / totalRecords : 0;
  const medianPredictedPrice = median(prices);

  const sqFtValues = records
    .filter((record) => record.features.squareFootage > 0)
    .map((record) => (record.predictedPrice as number) / record.features.squareFootage);

  const avgPricePerSquareFoot =
    sqFtValues.length > 0 ? sqFtValues.reduce((sum, value) => sum + value, 0) / sqFtValues.length : 0;

  const baselinePrices = baselineRecords.map((record) => record.predictedPrice as number);
  const baselineAvg =
    baselinePrices.length > 0
      ? baselinePrices.reduce((sum, value) => sum + value, 0) / baselinePrices.length
      : avgPredictedPrice;
  const baselineMedian = median(baselinePrices) || medianPredictedPrice;

  const baselineSqFt = baselineRecords
    .filter((record) => record.features.squareFootage > 0)
    .map((record) => (record.predictedPrice as number) / record.features.squareFootage);
  const baselineAvgSqFt =
    baselineSqFt.length > 0
      ? baselineSqFt.reduce((sum, value) => sum + value, 0) / baselineSqFt.length
      : avgPricePerSquareFoot;

  const pct = (current: number, base: number) => (base === 0 ? 0 : ((current - base) / base) * 100);

  const kpis: AnalysisKpis = {
    totalRecords,
    avgPredictedPrice,
    medianPredictedPrice,
    avgPricePerSquareFoot,
  };

  if (includeBaselineDelta) {
    kpis.deltaVsBaseline = {
      avgPredictedPrice: pct(avgPredictedPrice, baselineAvg),
      medianPredictedPrice: pct(medianPredictedPrice, baselineMedian),
      avgPricePerSquareFoot: pct(avgPricePerSquareFoot, baselineAvgSqFt),
    };
  }

  return kpis;
}

function buildPriceDistribution(records: PredictionRecord[]): AnalysisHistogramBucket[] {
  const prices = records.map((record) => record.predictedPrice as number);
  if (prices.length === 0) {
    return [];
  }

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const bucketCount = Math.min(8, Math.max(4, Math.ceil(Math.sqrt(prices.length))));
  const step = Math.max(50_000, Math.ceil((max - min) / bucketCount / 50_000) * 50_000);
  const start = Math.floor(min / step) * step;

  const buckets: AnalysisHistogramBucket[] = [];
  for (let index = 0; index < bucketCount; index += 1) {
    const rangeStart = start + index * step;
    const rangeEnd = rangeStart + step;
    const count = prices.filter((price) => price >= rangeStart && price < rangeEnd).length;
    buckets.push({
      label: `$${Math.round(rangeStart / 1000)}k–$${Math.round(rangeEnd / 1000)}k`,
      rangeStart,
      rangeEnd,
      count,
    });
  }

  return buckets;
}

function buildScatter(records: PredictionRecord[]): AnalysisScatterPoint[] {
  return records.slice(0, 500).map((record) => {
    const price = record.predictedPrice as number;
    return {
      recordId: record.id,
      title: record.title,
      squareFootage: record.features.squareFootage,
      price,
      predictedPrice: price,
    };
  });
}

function buildYearTrend(records: PredictionRecord[]): AnalysisYearBucket[] {
  const map = new Map<number, { total: number; count: number }>();

  records.forEach((record) => {
    const decade = Math.floor(record.features.yearBuilt / 10) * 10;
    const current = map.get(decade) ?? { total: 0, count: 0 };
    current.total += record.predictedPrice as number;
    current.count += 1;
    map.set(decade, current);
  });

  return [...map.entries()]
    .sort(([a], [b]) => a - b)
    .map(([decade, value]) => {
      const avgPrice = value.total / value.count;
      return {
        yearBuilt: decade,
        yearStart: decade,
        yearEnd: decade + 9,
        avgPrice,
        avgPredictedPrice: avgPrice,
        count: value.count,
      };
    });
}

function buildCharts(records: PredictionRecord[]): AnalysisCharts {
  return {
    priceDistribution: buildPriceDistribution(records),
    priceVsSquareFootage: buildScatter(records),
    yearBuiltTrend: buildYearTrend(records),
  };
}

type SortField =
  | "id"
  | "title"
  | "location"
  | "squareFootage"
  | "bedrooms"
  | "bathrooms"
  | "yearBuilt"
  | "lotSize"
  | "distanceToCityCenter"
  | "schoolRating"
  | "predictedPrice"
  | "createdAt";

function getSortValue(record: PredictionRecord, field: SortField): string | number {
  switch (field) {
    case "id":
      return record.id;
    case "title":
      return record.title;
    case "location":
      return record.location;
    case "squareFootage":
      return record.features.squareFootage;
    case "bedrooms":
      return record.features.bedrooms;
    case "bathrooms":
      return record.features.bathrooms;
    case "yearBuilt":
      return record.features.yearBuilt;
    case "lotSize":
      return record.features.lotSize;
    case "distanceToCityCenter":
      return record.features.distanceToCityCenter;
    case "schoolRating":
      return record.features.schoolRating;
    case "predictedPrice":
      return record.predictedPrice ?? 0;
    case "createdAt":
      return new Date(record.createdAt).getTime() || 0;
    default:
      return record.predictedPrice ?? 0;
  }
}

export function sortAnalysisRecords(
  records: PredictionRecord[],
  filters: AnalysisFilterInput,
): PredictionRecord[] {
  const field = (filters.sort as SortField | undefined) ?? "predictedPrice";
  const order = filters.order ?? "desc";

  return [...records].sort((a, b) => {
    const aValue = getSortValue(a, field);
    const bValue = getSortValue(b, field);

    if (typeof aValue === "string" && typeof bValue === "string") {
      const result = aValue.localeCompare(bValue);
      return order === "asc" ? result : -result;
    }

    const result = Number(aValue) - Number(bValue);
    return order === "asc" ? result : -result;
  });
}

export function paginateAnalysisRecords(
  records: PredictionRecord[],
  filters: AnalysisFilterInput,
): AnalysisRecordsResult {
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const size = filters.size ?? DEFAULT_PAGE_SIZE;
  const start = (page - 1) * size;

  return {
    items: records.slice(start, start + size),
    total: records.length,
    page,
    size,
  };
}

export function buildAnalysisDashboard(
  allRecords: PredictionRecord[],
  filters: AnalysisFilterInput,
): AnalysisDashboardData {
  const withPrice = allRecords.filter((record) => record.predictedPrice !== null);
  const filtered = filterAnalysisRecords(withPrice, filters);

  const performanceWarning =
    withPrice.length > PERFORMANCE_WARNING_THRESHOLD
      ? "Large dataset detected. Refine filters or use server-side aggregation for better performance."
      : undefined;

  return {
    kpis: computeKpis(filtered, withPrice, hasAnalysisDashboardFilters(filters)),
    charts: buildCharts(filtered),
    filteredCount: filtered.length,
    totalCount: withPrice.length,
    performanceWarning,
  };
}

export function buildAnalysisRecords(
  allRecords: PredictionRecord[],
  filters: AnalysisFilterInput,
): AnalysisRecordsResult {
  const withPrice = allRecords.filter((record) => record.predictedPrice !== null);
  const filtered = filterAnalysisRecords(withPrice, filters);
  const sorted = sortAnalysisRecords(filtered, filters);
  return paginateAnalysisRecords(sorted, filters);
}

export function buildAnalysisSegments(
  allRecords: PredictionRecord[],
  filters: AnalysisFilterInput,
  groupBy: AnalysisSegmentGroupKey,
): AnalysisSegmentsResult {
  const withPrice = allRecords.filter((record) => record.predictedPrice !== null);
  const filtered = filterAnalysisRecords(withPrice, filters);
  const buckets = new Map<
    string,
    { bucket: SegmentBucket; prices: number[] }
  >();

  filtered.forEach((record) => {
    const bucket = getSegmentBucket(record, groupBy);
    const current = buckets.get(bucket.groupKey) ?? { bucket, prices: [] };
    current.prices.push(record.predictedPrice as number);
    buckets.set(bucket.groupKey, current);
  });

  const rows = [...buckets.values()]
    .sort((a, b) => a.bucket.sortValue - b.bucket.sortValue)
    .map(({ bucket, prices }) =>
      buildSegmentStats(bucket.groupKey, bucket.group, prices, bucket.filterPatch),
    );

  return {
    groupBy,
    rows,
    filteredCount: filtered.length,
    totalCount: withPrice.length,
  };
}

export function getAnalysisRegionOptions(records: PredictionRecord[]): string[] {
  const regions = new Set<string>();
  records.forEach((record) => {
    regions.add(normalizeRegion(record.location));
  });
  return [...regions].sort((a, b) => a.localeCompare(b));
}
