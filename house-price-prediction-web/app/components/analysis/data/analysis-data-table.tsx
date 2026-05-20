"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import type { ReactNode } from "react";
import { formatUsd } from "@/lib/analysis/format";
import type { AnalysisFilterInput } from "@/lib/analysis/types";
import type { PredictionRecord } from "@/lib/valuation/types";

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

type AnalysisDataTableProps = {
  rows: PredictionRecord[];
  filters: AnalysisFilterInput;
  highlightId?: string;
  loading?: boolean;
  onSort: (field: SortField) => void;
  onRowClick: (record: PredictionRecord) => void;
};

const TABLE_COLUMN_COUNT = 8;

function sortAria(field: SortField, filters: AnalysisFilterInput): "ascending" | "descending" | "none" {
  if (filters.sort !== field) {
    return "none";
  }

  return filters.order === "asc" ? "ascending" : "descending";
}

function formatMoney(value: number | null): string {
  return value === null ? "—" : formatUsd(value);
}

type SortableHeaderProps = {
  label: ReactNode;
  sortKey: SortField;
  filters: AnalysisFilterInput;
  onSort: (field: SortField) => void;
  className?: string;
};

function SortableHeader({ label, sortKey, filters, onSort, className }: SortableHeaderProps) {
  const isActive = filters.sort === sortKey;
  const direction = isActive ? filters.order ?? "desc" : null;

  return (
    <th scope="col" className={className} aria-sort={sortAria(sortKey, filters)}>
      <button
        type="button"
        className="valuation-table-sort-btn"
        data-active={isActive ? "true" : "false"}
        onClick={() => onSort(sortKey)}
      >
        <span className="valuation-table-sort-btn-label">{label}</span>
        <span aria-hidden="true" className="valuation-table-sort-btn-icon">
          {direction === "asc" ? (
            <ArrowUp size={12} strokeWidth={2.25} />
          ) : direction === "desc" ? (
            <ArrowDown size={12} strokeWidth={2.25} />
          ) : (
            <ChevronsUpDown size={12} strokeWidth={2.25} />
          )}
        </span>
      </button>
    </th>
  );
}

export function AnalysisDataTable({
  rows,
  filters,
  highlightId,
  loading,
  onSort,
  onRowClick,
}: AnalysisDataTableProps) {
  return (
    <div className="valuation-table-panel analysis-table-panel">
      <div className="valuation-table-shell">
        <table className="valuation-table valuation-data-table valuation-data-table-compact analysis-data-table">
          <caption className="sr-only">Analysis prediction records</caption>
          <thead>
            <tr>
              <SortableHeader
                label="Square Footage"
                sortKey="squareFootage"
                filters={filters}
                onSort={onSort}
                className="valuation-table-cell-numeric"
              />
              <SortableHeader
                label="Bedrooms"
                sortKey="bedrooms"
                filters={filters}
                onSort={onSort}
                className="valuation-table-cell-numeric"
              />
              <SortableHeader
                label="Bathrooms"
                sortKey="bathrooms"
                filters={filters}
                onSort={onSort}
                className="valuation-table-cell-numeric"
              />
              <SortableHeader
                label="Year Built"
                sortKey="yearBuilt"
                filters={filters}
                onSort={onSort}
                className="valuation-table-cell-numeric"
              />
              <SortableHeader
                label="Lot Size"
                sortKey="lotSize"
                filters={filters}
                onSort={onSort}
                className="valuation-table-cell-numeric"
              />
              <SortableHeader
                label={
                  <>
                    Distance to
                    <br />
                    City Center
                  </>
                }
                sortKey="distanceToCityCenter"
                filters={filters}
                onSort={onSort}
                className="valuation-table-cell-numeric valuation-table-cell-distance"
              />
              <SortableHeader
                label="School Rating"
                sortKey="schoolRating"
                filters={filters}
                onSort={onSort}
                className="valuation-table-cell-numeric"
              />
              <SortableHeader
                label="Prediction Price"
                sortKey="predictedPrice"
                filters={filters}
                onSort={onSort}
                className="valuation-table-cell-numeric"
              />
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <tr key={`skeleton-${index}`} className="analysis-table-skeleton-row">
                    {Array.from({ length: TABLE_COLUMN_COUNT }).map((__, columnIndex) => (
                      <td key={columnIndex}>
                        <span className="analysis-table-skeleton" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((record, index) => (
                  <tr
                    key={record.id}
                    className={[
                      index % 2 === 1 ? "valuation-table-row-striped" : undefined,
                      highlightId === record.id ? "valuation-table-row-highlight" : undefined,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    tabIndex={0}
                    onClick={() => onRowClick(record)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onRowClick(record);
                      }
                    }}
                  >
                    <td className="valuation-table-cell-numeric">{record.features.squareFootage}</td>
                    <td className="valuation-table-cell-numeric">{record.features.bedrooms}</td>
                    <td className="valuation-table-cell-numeric">{record.features.bathrooms}</td>
                    <td className="valuation-table-cell-numeric">{record.features.yearBuilt}</td>
                    <td className="valuation-table-cell-numeric">{record.features.lotSize}</td>
                    <td className="valuation-table-cell-numeric">{record.features.distanceToCityCenter}</td>
                    <td className="valuation-table-cell-numeric">{record.features.schoolRating}</td>
                    <td className="valuation-table-cell-numeric">{formatMoney(record.predictedPrice)}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export type { SortField };
