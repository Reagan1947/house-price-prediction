import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { buildAnalysisDashboard, buildAnalysisRecords } from "@/lib/analysis/aggregators";
import { loadAllPredictionRecords } from "@/lib/analysis/prediction-loader";
import { parseAnalysisSearchParams } from "@/lib/analysis/filters";
import { formatNumber, formatUsd, formatUsdPerSqFt } from "@/lib/analysis/format";
import { AnalysisPrintTrigger } from "@/app/components/analysis/analysis-print-trigger";
import { getAuthTokenFromCookies } from "@/lib/auth/session";
import { getPredictions } from "@/lib/valuation/server";

export const metadata: Metadata = {
  title: "Market Analysis Print View",
};

type PrintPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readString(input: string | string[] | undefined): string | undefined {
  if (!input) {
    return undefined;
  }

  return Array.isArray(input) ? input[0] : input;
}

const ALLOWED_SCOPE = new Set(["dashboard", "table", "selected"]);

export default async function AnalysisPrintPage({ searchParams }: PrintPageProps) {
  const token = await getAuthTokenFromCookies();
  if (!token) {
    redirect("/login");
  }

  const resolved = (await searchParams) ?? {};
  const params = new URLSearchParams();
  Object.entries(resolved).forEach(([key, value]) => {
    const text = readString(value);
    if (text) {
      params.set(key, text);
    }
  });

  const { filters } = parseAnalysisSearchParams(params);
  const scope = ALLOWED_SCOPE.has(readString(resolved.scope) ?? "")
    ? (readString(resolved.scope) as "dashboard" | "table" | "selected")
    : "dashboard";

  const predictions = await loadAllPredictionRecords(getPredictions);
  const records = predictions.items.filter((record) => record.predictedPrice !== null);
  const dashboard = buildAnalysisDashboard(records, filters);
  const table = buildAnalysisRecords(records, filters);

  return (
    <main className="analysis-print-page">
      <header>
        <h1>Market Analysis Report</h1>
        <p>
          Scope: {scope} · Showing {formatNumber(dashboard.filteredCount)} of{" "}
          {formatNumber(dashboard.totalCount)} records
        </p>
      </header>

      <section>
        <h2>KPI summary</h2>
        <ul>
          <li>Total records: {formatNumber(dashboard.kpis.totalRecords)}</li>
          <li>Average predicted price: {formatUsd(dashboard.kpis.avgPredictedPrice)}</li>
          <li>Median predicted price: {formatUsd(dashboard.kpis.medianPredictedPrice)}</li>
          <li>Average price per sq.ft.: {formatUsdPerSqFt(dashboard.kpis.avgPricePerSquareFoot)}</li>
        </ul>
      </section>

      <section>
        <h2>Price distribution</h2>
        <table>
          <thead>
            <tr>
              <th>Bucket</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            {dashboard.charts.priceDistribution.map((bucket) => (
              <tr key={bucket.label}>
                <td>{bucket.label}</td>
                <td>{bucket.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Sample records</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Location</th>
              <th>Predicted Price</th>
            </tr>
          </thead>
          <tbody>
            {table.items.slice(0, 25).map((record) => (
              <tr key={record.id}>
                <td>{record.id}</td>
                <td>{record.title}</td>
                <td>{record.location}</td>
                <td>{formatUsd(record.predictedPrice ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <AnalysisPrintTrigger />
    </main>
  );
}
