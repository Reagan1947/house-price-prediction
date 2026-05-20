"use client";

import type { ComparisonSeries } from "@/lib/valuation/types";

type ComparisonDataTableProps = {
  series: ComparisonSeries[];
  focusedRecordId: string | null;
  onFocusRecord: (recordId: string) => void;
};

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ComparisonDataTable({ series, focusedRecordId, onFocusRecord }: ComparisonDataTableProps) {
  return (
    <div className="valuation-chart-card valuation-chart-card-full">
      <h3 className="valuation-chart-title">Comparison Data Table</h3>
      <p className="valuation-chart-hint">Click a row to highlight the same record in charts above.</p>
      <div className="valuation-table-shell">
        <table className="valuation-table valuation-data-table valuation-comparison-data-table">
          <caption className="sr-only">Comparison data for selected prediction records</caption>
          <thead>
            <tr>
              <th scope="col">Title</th>
              <th scope="col">Location</th>
              <th scope="col" className="valuation-table-cell-numeric">
                Square Footage
              </th>
              <th scope="col" className="valuation-table-cell-numeric">
                Bedrooms
              </th>
              <th scope="col" className="valuation-table-cell-numeric">
                Bathrooms
              </th>
              <th scope="col" className="valuation-table-cell-numeric">
                Year Built
              </th>
              <th scope="col" className="valuation-table-cell-numeric">
                Lot Size
              </th>
              <th scope="col" className="valuation-table-cell-numeric">
                Distance to City Center
              </th>
              <th scope="col" className="valuation-table-cell-numeric">
                School Rating
              </th>
              <th scope="col" className="valuation-table-cell-numeric">
                Predicted Price
              </th>
            </tr>
          </thead>
          <tbody>
            {series.map((item, index) => {
              const isFocused = focusedRecordId === item.recordId;
              const isMuted = focusedRecordId !== null && !isFocused;
              const isStriped = index % 2 === 1;

              return (
                <tr
                  key={item.recordId}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isFocused}
                  className={[
                    "valuation-comparison-table-row",
                    isStriped ? "valuation-table-row-striped" : undefined,
                    isFocused ? "valuation-table-row-highlight valuation-comparison-series-focused" : undefined,
                    isMuted ? "valuation-comparison-series-muted" : undefined,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => onFocusRecord(item.recordId)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onFocusRecord(item.recordId);
                    }
                  }}
                >
                  <td>{item.title}</td>
                  <td>{item.location ?? "-"}</td>
                  <td className="valuation-table-cell-numeric">{item.features.squareFootage}</td>
                  <td className="valuation-table-cell-numeric">{item.features.bedrooms}</td>
                  <td className="valuation-table-cell-numeric">{item.features.bathrooms}</td>
                  <td className="valuation-table-cell-numeric">{item.features.yearBuilt}</td>
                  <td className="valuation-table-cell-numeric">{item.features.lotSize}</td>
                  <td className="valuation-table-cell-numeric">{item.features.distanceToCityCenter}</td>
                  <td className="valuation-table-cell-numeric">{item.features.schoolRating}</td>
                  <td className="valuation-table-cell-numeric">{formatMoney(item.predictedPrice)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
