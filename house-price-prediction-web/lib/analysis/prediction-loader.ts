import type { PredictionListResult, PredictionRecord } from "@/lib/valuation/types";

/** Backend list API typically caps page size at 100 (same as Valuation app). */
export const ANALYSIS_PREDICTION_PAGE_SIZE = 100;

/** Client aggregation cap: 50 pages × 100 rows = 5,000 records. */
const MAX_PAGES = 50;

export type LoadPredictionsFn = (query?: {
  page?: number;
  size?: number;
}) => Promise<PredictionListResult & { historyUnavailable?: boolean }>;

export type LoadAllPredictionsResult = {
  items: PredictionRecord[];
  historyUnavailable?: boolean;
  loadError?: string;
};

export async function loadAllPredictionRecords(
  getPredictions: LoadPredictionsFn,
): Promise<LoadAllPredictionsResult> {
  try {
    const firstPage = await getPredictions({ page: 1, size: ANALYSIS_PREDICTION_PAGE_SIZE });

    if (firstPage.historyUnavailable) {
      return { items: [], historyUnavailable: true };
    }

    const items = [...firstPage.items];
    const totalPages = Math.min(firstPage.totalPages ?? 1, MAX_PAGES);

    for (let page = 2; page <= totalPages; page += 1) {
      try {
        const nextPage = await getPredictions({ page, size: ANALYSIS_PREDICTION_PAGE_SIZE });
        items.push(...nextPage.items);
      } catch {
        break;
      }
    }

    return { items };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load prediction records.";
    return { items: [], loadError: message };
  }
}
