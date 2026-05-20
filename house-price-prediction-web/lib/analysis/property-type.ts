import type { PredictionRecord } from "@/lib/valuation/types";
import type { PropertyType } from "./types";

export function inferPropertyType(record: PredictionRecord): PropertyType {
  const title = record.title.toLowerCase();

  if (title.includes("villa")) {
    return "villa";
  }

  if (title.includes("townhouse") || title.includes("town house")) {
    return "townhouse";
  }

  if (title.includes("apartment") || title.includes("condo") || title.includes("flat")) {
    return "apartment";
  }

  if (record.features.lotSize > 8000) {
    return "house";
  }

  return "apartment";
}
