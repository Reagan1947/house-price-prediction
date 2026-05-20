import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AnalysisShell } from "@/app/components/analysis/analysis-shell";
import { getAuthTokenFromCookies, getCurrentUser } from "@/lib/auth/session";
import type { PredictionRecord } from "@/lib/valuation/types";
import { loadAllPredictionRecords } from "@/lib/analysis/prediction-loader";
import { PREDICTION_HISTORY_UNAVAILABLE_MSG } from "@/lib/valuation/api-helpers";
import { ValuationApiError } from "@/lib/valuation/errors";
import { getPredictions } from "@/lib/valuation/server";

export const metadata: Metadata = {
  title: "Market Analysis | House Price Prediction",
  description: "Explore market trends, run what-if scenarios, and export analysis records.",
};

export default async function AnalysisPage() {
  const token = await getAuthTokenFromCookies();

  if (!token) {
    redirect("/login");
  }

  const currentUser = await getCurrentUser();
  const displayUserName = currentUser?.username || currentUser?.email || "User";
  let initialRecords: PredictionRecord[] = [];
  let initialWarning: string | undefined;

  try {
    const predictions = await loadAllPredictionRecords(getPredictions);
    initialRecords = predictions.items;

    if (predictions.historyUnavailable) {
      initialWarning = PREDICTION_HISTORY_UNAVAILABLE_MSG;
    } else if (predictions.loadError) {
      initialWarning = predictions.loadError;
    }
  } catch (error) {
    initialWarning =
      error instanceof ValuationApiError
        ? error.message
        : "Failed to load prediction records. You can retry from the page header.";
  }

  return (
    <AnalysisShell
      initialRecords={initialRecords}
      initialWarning={initialWarning}
      currentUserName={displayUserName}
    />
  );
}
