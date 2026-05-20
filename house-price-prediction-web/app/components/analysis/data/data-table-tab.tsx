"use client";

import { ChevronDown, ChevronUp, Download } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
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
import { getPaginationItems } from "@/lib/pagination";
import type { AnalysisFilterInput, AnalysisRecordsResult } from "@/lib/analysis/types";
import type { PredictionRecord } from "@/lib/valuation/types";
import { AnalysisDataCards } from "./analysis-data-cards";
import { AnalysisDataTable, type SortField } from "./analysis-data-table";
import { AnalysisRecordDrawer } from "./analysis-record-drawer";

type DataTableTabProps = {
  result: AnalysisRecordsResult | null;
  filters: AnalysisFilterInput;
  loading: boolean;
  error: string | null;
  drawerRecord: PredictionRecord | null;
  onSort: (field: SortField) => void;
  onPageChange: (page: number) => void;
  onSizeChange: (size: 10 | 20 | 50) => void;
  onRetry: () => void;
  onRowClick: (record: PredictionRecord) => void;
  onDrawerClose: () => void;
  onUseBaseline: (record: PredictionRecord) => void;
  onAddCompare: (record: PredictionRecord) => void;
  exportBusy: boolean;
  onExportCsv: () => void;
  onExportExcel: () => void;
};

export function DataTableTab({
  result,
  filters,
  loading,
  error,
  drawerRecord,
  onSort,
  onPageChange,
  onSizeChange,
  onRetry,
  onRowClick,
  onDrawerClose,
  onUseBaseline,
  onAddCompare,
  exportBusy,
  onExportCsv,
  onExportExcel,
}: DataTableTabProps) {
  const sectionId = useId();
  const exportMenuId = `${sectionId}-export-menu`;
  const exportTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const rows = result?.items ?? [];
  const total = result?.total ?? 0;
  const page = result?.page ?? 1;
  const size = result?.size ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const pageItems = getPaginationItems(page, totalPages);
  const exportDisabled = loading || exportBusy || total === 0;

  useEffect(() => {
    if (!exportOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!exportTriggerRef.current?.parentElement?.contains(event.target as Node)) {
        setExportOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setExportOpen(false);
        exportTriggerRef.current?.focus();
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [exportOpen]);

  return (
    <section className="analysis-data-tab" aria-labelledby={`${sectionId}-title`}>
      <header className="analysis-data-tab-head">
        <div className="analysis-panel-heading">
          <h2 id={`${sectionId}-title`} className="analysis-data-tab-title">
            Data Table
          </h2>
          <p className="analysis-panel-description">
            Review the filtered prediction records and sort columns for quick comparison.
          </p>
        </div>
        <div className="analysis-data-tab-actions">
          <button
            type="button"
            className="analysis-panel-toggle"
            aria-expanded={!collapsed}
            aria-controls={`${sectionId}-content`}
            onClick={() => setCollapsed((current) => !current)}
          >
            {collapsed ? "Expand" : "Collapse"}
            {collapsed ? <ChevronDown aria-hidden size={16} /> : <ChevronUp aria-hidden size={16} />}
          </button>
        </div>
      </header>

      {!collapsed ? (
        <div id={`${sectionId}-content`} className="analysis-data-tab-content">
          {error ? (
            <div className="valuation-feedback valuation-feedback-danger" role="alert">
              <p>{error}</p>
              <button type="button" className="valuation-inline-btn" onClick={onRetry}>
                Retry
              </button>
            </div>
          ) : null}

          {!loading && rows.length === 0 ? (
            <div className="analysis-empty" role="status">
              <p>No records match the current filters.</p>
            </div>
          ) : null}

          <div className="analysis-data-table-desktop">
            <AnalysisDataTable
              rows={rows}
              filters={filters}
              highlightId={filters.highlightId}
              loading={loading}
              onSort={onSort}
              onRowClick={onRowClick}
            />
          </div>

          <div className="analysis-data-table-mobile">
            <AnalysisDataCards
              rows={rows}
              highlightId={filters.highlightId}
              onView={onRowClick}
              onUseBaseline={onUseBaseline}
              onAddCompare={onAddCompare}
            />
          </div>

          <nav className="valuation-table-pagination analysis-data-table-footer" aria-label="Analysis table pagination">
            <div className="analysis-export-menu">
              <button
                ref={exportTriggerRef}
                type="button"
                className="valuation-btn valuation-btn-secondary analysis-data-export-trigger"
                aria-haspopup="menu"
                aria-expanded={exportOpen}
                aria-controls={exportMenuId}
                disabled={exportDisabled}
                title={exportDisabled ? "Nothing to export." : undefined}
                onClick={() => setExportOpen((current) => !current)}
              >
                <Download aria-hidden size={14} />
                Export
                <ChevronDown aria-hidden size={14} />
              </button>

              {exportOpen ? (
                <ul id={exportMenuId} className="analysis-export-dropdown" role="menu">
                  <li role="none">
                    <button
                      type="button"
                      role="menuitem"
                      className="analysis-export-item"
                      onClick={() => {
                        onExportCsv();
                        setExportOpen(false);
                      }}
                    >
                      Export as CSV
                    </button>
                  </li>
                  <li role="none">
                    <button
                      type="button"
                      role="menuitem"
                      className="analysis-export-item"
                      onClick={() => {
                        onExportExcel();
                        setExportOpen(false);
                      }}
                    >
                      Export as Excel
                    </button>
                  </li>
                </ul>
              ) : null}
            </div>

            <div className="valuation-table-pagination-controls">
              <label className="valuation-table-pagination-label" htmlFor={`${sectionId}-rows-per-page`}>
                Rows per page:
              </label>
              <Select
                value={String(size)}
                onValueChange={(value) => onSizeChange(Number(value) as 10 | 20 | 50)}
              >
                <SelectTrigger
                  id={`${sectionId}-rows-per-page`}
                  className="valuation-table-pagination-select"
                  aria-label="Rows per page"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50].map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Pagination className="valuation-table-pagination-nav">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      disabled={page <= 1}
                      onClick={() => {
                        if (page > 1) {
                          onPageChange(page - 1);
                        }
                      }}
                    />
                  </PaginationItem>

                  {pageItems.map((item, index) => (
                    <PaginationItem key={item === "ellipsis" ? `ellipsis-${index}` : item}>
                      {item === "ellipsis" ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink isActive={item === page} onClick={() => onPageChange(item)}>
                          {item}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      disabled={page >= totalPages}
                      onClick={() => {
                        if (page < totalPages) {
                          onPageChange(page + 1);
                        }
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </nav>
        </div>
      ) : null}

      <AnalysisRecordDrawer
        record={drawerRecord}
        onClose={onDrawerClose}
        onUseBaseline={onUseBaseline}
        onAddCompare={onAddCompare}
      />
    </section>
  );
}
