import type { ApiResponse } from "@/lib/api/response";

export const PREDICTION_HISTORY_UNAVAILABLE_MSG =
  "Prediction history is not available on the server yet. You can still run price predictions, but saving records requires the /api/v1/predictions API.";

export function isPredictionHistoryUnavailable(status: number, payload: ApiResponse<unknown>): boolean {
  return status === 404 || payload.code === 404;
}
