"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import type { PredictionRecord } from "@/lib/valuation/types";
import { getPageRange, getPaginationItems } from "@/lib/pagination";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type PredictionTableProps = {
  records: PredictionRecord[];
  isLoading: boolean;
  highlightPredictionId?: string;
  showCompareColumn?: boolean;
  hideActions?: boolean;
  selectedForComparison?: string[];
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  onReuse: (id: string) => void;
  onToggleCompare?: (id: string) => void;
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

type SortableKey =
  | "id"
  | "title"
  | "createDate"
  | "squareFootage"
  | "bedrooms"
  | "bathrooms"
  | "yearBuilt"
  | "lotSize"
  | "distanceToCityCenter"
  | "schoolRating"
  | "predictedPrice";

type SortDirection = "asc" | "desc";

type SortState = { key: SortableKey; direction: SortDirection } | null;

function formatMoney(value: number | null): string {
  if (value === null) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US");
}

function getSortValue(record: PredictionRecord, key: SortableKey): string | number {
  switch (key) {
    case "id":
      return record.id;
    case "title":
      return record.title;
    case "createDate": {
      const ts = new Date(record.createdAt).getTime();
      return Number.isNaN(ts) ? record.createdAt : ts;
    }
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
      return record.predictedPrice ?? -1;
  }
}

function compareValues(a: string | number, b: string | number): number {
  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

type SortableHeaderProps = {
  label: ReactNode;
  sortKey: SortableKey;
  sortState: SortState;
  onSort: (key: SortableKey) => void;
  className?: string;
};

function SortableHeader({ label, sortKey, sortState, onSort, className }: SortableHeaderProps) {
  const isActive = sortState?.key === sortKey;
  const direction: SortDirection | null = isActive ? sortState!.direction : null;
  const ariaSort: "ascending" | "descending" | "none" =
    direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none";

  return (
    <th scope="col" className={className} aria-sort={ariaSort}>
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

export function PredictionTable({
  records,
  isLoading,
  highlightPredictionId,
  showCompareColumn = false,
  hideActions = false,
  selectedForComparison = [],
  onDelete,
  onView,
  onReuse,
  onToggleCompare,
}: PredictionTableProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  const [sortState, setSortState] = useState<SortState>(null);

  const sortedRecords = useMemo(() => {
    if (!sortState) return records;
    const next = [...records];
    next.sort((a, b) => {
      const result = compareValues(getSortValue(a, sortState.key), getSortValue(b, sortState.key));
      return sortState.direction === "asc" ? result : -result;
    });
    return next;
  }, [records, sortState]);

  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [currentPage, pageSize, sortedRecords]);

  const pageItems = useMemo(() => getPaginationItems(currentPage, totalPages), [currentPage, totalPages]);
  const { start: rangeStart, end: rangeEnd } = getPageRange(currentPage, pageSize, sortedRecords.length);

  const handleSort = (key: SortableKey) => {
    setSortState((current) => {
      if (!current || current.key !== key) return { key, direction: "asc" };
      if (current.direction === "asc") return { key, direction: "desc" };
      return null;
    });
    setPage(1);
  };

  if (isLoading) {
    return (
      <div className="valuation-table-shell" aria-hidden>
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="valuation-table-skeleton" />
        ))}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="valuation-feedback" role="status">
        <p>No prediction records found. Create a new prediction to get started.</p>
      </div>
    );
  }

  return (
    <div className="valuation-table-panel">
      <div className="valuation-table-shell">
        <table
          className={[
            "valuation-table",
            "valuation-data-table",
            showCompareColumn ? undefined : "valuation-data-table-compact",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <caption className="sr-only">Prediction records</caption>
          <thead>
            <tr>
              {showCompareColumn ? (
                <th scope="col" className="valuation-table-cell-checkbox">
                  Compare
                </th>
              ) : null}
              <SortableHeader label="ID" sortKey="id" sortState={sortState} onSort={handleSort} />
              <SortableHeader label="Title" sortKey="title" sortState={sortState} onSort={handleSort} />
              <th scope="col">Location</th>
              <SortableHeader label="Create Date" sortKey="createDate" sortState={sortState} onSort={handleSort} />
              <SortableHeader
                label="Square Footage"
                sortKey="squareFootage"
                sortState={sortState}
                onSort={handleSort}
                className="valuation-table-cell-numeric"
              />
              <SortableHeader
                label="Bedrooms"
                sortKey="bedrooms"
                sortState={sortState}
                onSort={handleSort}
                className="valuation-table-cell-numeric"
              />
              <SortableHeader
                label="Bathrooms"
                sortKey="bathrooms"
                sortState={sortState}
                onSort={handleSort}
                className="valuation-table-cell-numeric"
              />
              <SortableHeader
                label="Year Built"
                sortKey="yearBuilt"
                sortState={sortState}
                onSort={handleSort}
                className="valuation-table-cell-numeric"
              />
              <SortableHeader
                label="Lot Size"
                sortKey="lotSize"
                sortState={sortState}
                onSort={handleSort}
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
                sortState={sortState}
                onSort={handleSort}
                className="valuation-table-cell-numeric valuation-table-cell-distance"
              />
              <SortableHeader
                label="School Rating"
                sortKey="schoolRating"
                sortState={sortState}
                onSort={handleSort}
                className="valuation-table-cell-numeric"
              />
              <SortableHeader
                label="Prediction Price"
                sortKey="predictedPrice"
                sortState={sortState}
                onSort={handleSort}
                className="valuation-table-cell-numeric"
              />
              {hideActions ? null : (
                <th scope="col" className="valuation-table-cell-actions">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedRecords.map((record, index) => {
              const isSelected = selectedForComparison.includes(record.id);
              const isCompareDisabled = !isSelected && record.predictedPrice === null;
              const isHighlighted = record.id === highlightPredictionId;
              const isStriped = index % 2 === 1;

              return (
                <tr
                  key={record.id}
                  className={[
                    isStriped ? "valuation-table-row-striped" : undefined,
                    isHighlighted ? "valuation-table-row-highlight" : undefined,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {showCompareColumn ? (
                    <td className="valuation-table-cell-checkbox">
                      <input
                        aria-label={`Select ${record.title} for comparison`}
                        type="checkbox"
                        checked={isSelected}
                        disabled={isCompareDisabled}
                        onChange={() => onToggleCompare?.(record.id)}
                      />
                    </td>
                  ) : null}
                  <td>{record.id}</td>
                  <td>{record.title}</td>
                  <td>{record.location}</td>
                  <td>{formatDate(record.createdAt)}</td>
                  <td className="valuation-table-cell-numeric">{record.features.squareFootage}</td>
                  <td className="valuation-table-cell-numeric">{record.features.bedrooms}</td>
                  <td className="valuation-table-cell-numeric">{record.features.bathrooms}</td>
                  <td className="valuation-table-cell-numeric">{record.features.yearBuilt}</td>
                  <td className="valuation-table-cell-numeric">{record.features.lotSize}</td>
                  <td className="valuation-table-cell-numeric">{record.features.distanceToCityCenter}</td>
                  <td className="valuation-table-cell-numeric">{record.features.schoolRating}</td>
                  <td className="valuation-table-cell-numeric">{formatMoney(record.predictedPrice)}</td>
                  {hideActions ? null : (
                    <td className="valuation-table-cell-actions">
                      <div className="valuation-table-actions">
                        <button type="button" className="valuation-inline-btn" onClick={() => onView(record.id)}>
                          View
                        </button>
                        <span aria-hidden="true" className="valuation-table-actions-divider" />
                        <button type="button" className="valuation-inline-btn" onClick={() => onReuse(record.id)}>
                          Edit
                        </button>
                        <span aria-hidden="true" className="valuation-table-actions-divider" />
                        <button
                          type="button"
                          className="valuation-inline-btn valuation-inline-btn-danger"
                          onClick={() => onDelete(record.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <nav className="valuation-table-pagination" aria-label="Table pagination">
        <p className="valuation-table-pagination-info" aria-live="polite">
          Showing {rangeStart}-{rangeEnd} of {sortedRecords.length} results
        </p>

        <div className="valuation-table-pagination-controls">
          <label className="valuation-table-pagination-label" htmlFor="prediction-rows-per-page">
            Rows per page:
          </label>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              setPageSize(Number(value));
              setPage(1);
            }}
          >
            <SelectTrigger id="prediction-rows-per-page" className="valuation-table-pagination-select" aria-label="Rows per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Pagination className="valuation-table-pagination-nav">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious disabled={currentPage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} />
              </PaginationItem>

              {pageItems.map((item, index) => (
                <PaginationItem key={item === "ellipsis" ? `ellipsis-${index}` : item}>
                  {item === "ellipsis" ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink isActive={item === currentPage} onClick={() => setPage(item)}>
                      {item}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </nav>
    </div>
  );
}
