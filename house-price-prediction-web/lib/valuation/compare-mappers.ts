import type { ComparisonSeries, PredictionRecord } from "./types";

export function canCompareRecord(record: PredictionRecord): record is PredictionRecord & { predictedPrice: number } {
  return record.predictedPrice !== null;
}

export function toComparisonSeries(record: PredictionRecord & { predictedPrice: number }): ComparisonSeries {
  return {
    recordId: record.id,
    title: record.title,
    location: record.location,
    predictedPrice: record.predictedPrice,
    features: {
      ...record.features,
    },
  };
}

export function buildComparisonSeries(records: PredictionRecord[], recordIds: string[]): ComparisonSeries[] {
  const uniqueIds = Array.from(new Set(recordIds));

  return uniqueIds
    .map((recordId) => records.find((item) => item.id === recordId))
    .filter((item): item is PredictionRecord => Boolean(item))
    .filter(canCompareRecord)
    .map(toComparisonSeries);
}
