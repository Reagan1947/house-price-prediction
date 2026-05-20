import type { PredictionRecord } from "@/lib/valuation/types";

const CSV_EXPORT_LIMIT = 10_000;

const CSV_COLUMNS: Array<{ key: string; label: string; getValue: (record: PredictionRecord) => string }> = [
  { key: "id", label: "ID", getValue: (record) => record.id },
  { key: "title", label: "Title", getValue: (record) => record.title },
  { key: "location", label: "Location", getValue: (record) => record.location },
  {
    key: "squareFootage",
    label: "Square Footage",
    getValue: (record) => String(record.features.squareFootage),
  },
  { key: "bedrooms", label: "Bedrooms", getValue: (record) => String(record.features.bedrooms) },
  { key: "bathrooms", label: "Bathrooms", getValue: (record) => String(record.features.bathrooms) },
  { key: "yearBuilt", label: "Year Built", getValue: (record) => String(record.features.yearBuilt) },
  { key: "lotSize", label: "Lot Size", getValue: (record) => String(record.features.lotSize) },
  {
    key: "distanceToCityCenter",
    label: "Distance to City Center",
    getValue: (record) => String(record.features.distanceToCityCenter),
  },
  {
    key: "schoolRating",
    label: "School Rating",
    getValue: (record) => String(record.features.schoolRating),
  },
  {
    key: "predictedPrice",
    label: "Predicted Price",
    getValue: (record) => String(record.predictedPrice ?? ""),
  },
  { key: "createdAt", label: "Created At", getValue: (record) => record.createdAt },
];

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

export function buildAnalysisCsv(records: PredictionRecord[]): string {
  const header = CSV_COLUMNS.map((column) => escapeCsvCell(column.label)).join(",");
  const rows = records.map((record) =>
    CSV_COLUMNS.map((column) => escapeCsvCell(column.getValue(record))).join(","),
  );

  return [header, ...rows].join("\r\n");
}

export function buildAnalysisCsvFilename(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  const stamp = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
  return `market-analysis-records-${stamp}.csv`;
}

export function downloadAnalysisCsv(records: PredictionRecord[]): { ok: true } | { ok: false; message: string } {
  if (records.length === 0) {
    return { ok: false, message: "Nothing to export." };
  }

  if (records.length > CSV_EXPORT_LIMIT) {
    return {
      ok: false,
      message: "Export is limited to 10,000 records. Refine filters first.",
    };
  }

  const blob = new Blob([buildAnalysisCsv(records)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = buildAnalysisCsvFilename();
  anchor.click();
  URL.revokeObjectURL(url);

  return { ok: true };
}
