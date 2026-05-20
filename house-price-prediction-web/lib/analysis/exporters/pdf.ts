import { serializeAnalysisFilters } from "../filters";
import type { AnalysisFilterInput } from "../types";

export type PdfExportScope = "dashboard" | "table" | "selected";

export function buildAnalysisPrintUrl(
  filters: AnalysisFilterInput,
  scope: PdfExportScope,
  selectedIds?: string[],
): string {
  const params = serializeAnalysisFilters(filters);
  params.set("scope", scope);

  if (selectedIds && selectedIds.length > 0) {
    params.set("ids", selectedIds.join(","));
  }

  return `/analysis/print?${params.toString()}`;
}

export function openAnalysisPrintView(
  filters: AnalysisFilterInput,
  scope: PdfExportScope,
  selectedIds?: string[],
): Window | null {
  const url = buildAnalysisPrintUrl(filters, scope, selectedIds);
  return window.open(url, "_blank", "noopener,noreferrer");
}

export function triggerPrintWhenReady(printWindow: Window | null): void {
  if (!printWindow) {
    return;
  }

  const tryPrint = () => {
    printWindow.focus();
    printWindow.print();
  };

  printWindow.addEventListener("load", tryPrint);
  window.setTimeout(tryPrint, 1200);
}
