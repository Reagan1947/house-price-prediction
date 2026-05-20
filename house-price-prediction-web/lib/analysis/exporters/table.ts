import type { PredictionRecord } from "@/lib/valuation/types";

const TABLE_EXPORT_LIMIT = 10_000;

const TABLE_EXPORT_COLUMNS: Array<{ label: string; getValue: (record: PredictionRecord) => string }> = [
  { label: "Square Footage", getValue: (record) => String(record.features.squareFootage) },
  { label: "Bedrooms", getValue: (record) => String(record.features.bedrooms) },
  { label: "Bathrooms", getValue: (record) => String(record.features.bathrooms) },
  { label: "Year Built", getValue: (record) => String(record.features.yearBuilt) },
  { label: "Lot Size", getValue: (record) => String(record.features.lotSize) },
  {
    label: "Distance to City Center",
    getValue: (record) => String(record.features.distanceToCityCenter),
  },
  { label: "School Rating", getValue: (record) => String(record.features.schoolRating) },
  { label: "Prediction Price", getValue: (record) => String(record.predictedPrice ?? "") },
];

function buildTimestamp(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
}

function escapeCsvCell(value: string): string {
  let safe = value;
  if (/^[=+\-@]/.test(safe)) {
    safe = `'${safe}`;
  }

  if (safe.includes('"') || safe.includes(",") || safe.includes("\n") || safe.includes("\r")) {
    return `"${safe.replace(/"/g, '""')}"`;
  }

  return safe;
}

function escapeHtmlCell(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function validateTableExport(records: PredictionRecord[]): { ok: true } | { ok: false; message: string } {
  if (records.length === 0) {
    return { ok: false, message: "Nothing to export." };
  }

  if (records.length > TABLE_EXPORT_LIMIT) {
    return {
      ok: false,
      message: "Export is limited to 10,000 records. Refine filters first.",
    };
  }

  return { ok: true };
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadAnalysisTableCsv(records: PredictionRecord[]): { ok: true } | { ok: false; message: string } {
  const validation = validateTableExport(records);
  if (!validation.ok) {
    return validation;
  }

  const header = TABLE_EXPORT_COLUMNS.map((column) => escapeCsvCell(column.label)).join(",");
  const rows = records.map((record) =>
    TABLE_EXPORT_COLUMNS.map((column) => escapeCsvCell(column.getValue(record))).join(","),
  );
  const blob = new Blob([[header, ...rows].join("\r\n")], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `analysis-data-table-${buildTimestamp()}.csv`);

  return { ok: true };
}

export function downloadAnalysisTableExcel(records: PredictionRecord[]): { ok: true } | { ok: false; message: string } {
  const validation = validateTableExport(records);
  if (!validation.ok) {
    return validation;
  }

  const header = TABLE_EXPORT_COLUMNS.map((column) => `<th>${escapeHtmlCell(column.label)}</th>`).join("");
  const rows = records
    .map((record) =>
      `<tr>${TABLE_EXPORT_COLUMNS.map((column) => `<td>${escapeHtmlCell(column.getValue(record))}</td>`).join("")}</tr>`,
    )
    .join("");
  const html = `<!doctype html><html><head><meta charset="utf-8" /></head><body><table><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table></body></html>`;
  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  downloadBlob(blob, `analysis-data-table-${buildTimestamp()}.xls`);

  return { ok: true };
}
