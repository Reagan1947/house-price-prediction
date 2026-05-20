import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { normalizeTab } from "@/lib/valuation/mappers";
import { PREDICTION_HISTORY_UNAVAILABLE_MSG } from "@/lib/valuation/api-helpers";
import { getPredictions } from "@/lib/valuation/server";
import { ValuationShell } from "@/app/components/valuation/valuation-shell";
import { getAuthTokenFromCookies, getCurrentUser } from "@/lib/auth/session";

type ValuationPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: "Valuation | House Price Prediction",
  description: "Create, manage, and compare house price valuation predictions.",
};

function readString(input: string | string[] | undefined): string | undefined {
  if (!input) {
    return undefined;
  }

  return Array.isArray(input) ? input[0] : input;
}

export default async function ValuationPage({ searchParams }: ValuationPageProps) {
  const token = await getAuthTokenFromCookies();

  if (!token) {
    redirect("/login");
  }

  const currentUser = await getCurrentUser();
  const displayUserName = currentUser?.username || currentUser?.email || "User";

  const resolvedSearchParams = (await searchParams) ?? {};
  const mode = readString(resolvedSearchParams.mode);
  const view = readString(resolvedSearchParams.view);

  if (mode === "analysis" || view === "analysis") {
    redirect("/analysis?tab=dashboard");
  }

  const predictions = await getPredictions();
  const historyWarning = predictions.historyUnavailable ? PREDICTION_HISTORY_UNAVAILABLE_MSG : undefined;
  const tab = normalizeTab({
    tab: readString(resolvedSearchParams.tab) ?? null,
    mode: readString(resolvedSearchParams.mode) ?? null,
    view: readString(resolvedSearchParams.view) ?? null,
  });

  const predictionId = readString(resolvedSearchParams.predictionId);

  return (
    <ValuationShell
      initialTab={tab}
      initialPredictionId={predictionId}
      initialRecords={predictions.items}
      initialWarning={historyWarning}
      currentUserName={displayUserName}
    />
  );
}
