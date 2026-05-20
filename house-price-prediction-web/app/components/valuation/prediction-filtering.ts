import type { PredictionRecord } from "@/lib/valuation/types";
import type { PredictionFilters } from "./prediction-filter-bar";

export const EMPTY_PREDICTION_FILTERS: PredictionFilters = {
  id: "",
  title: "",
  location: "",
  createDateFrom: "",
  createDateTo: "",
  squareFootage: "",
  bedrooms: "",
  bathrooms: "",
  yearBuilt: "",
  lotSize: "",
  distanceToCityCenter: "",
  schoolRating: "",
  predictionPrice: "",
};

function normalizeText(input: string): string {
  return input.trim().toLowerCase();
}

function parseOptionalNumber(input: string): number | null {
  const value = input.trim();
  if (value.length === 0) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toLocalDateKey(input: string): string {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function filterPredictionRecords(records: PredictionRecord[], filters: PredictionFilters): PredictionRecord[] {
  const idQuery = normalizeText(filters.id);
  const titleQuery = normalizeText(filters.title);
  const locationQuery = normalizeText(filters.location);
  const createDateFromQuery = filters.createDateFrom.trim();
  const createDateToQuery = filters.createDateTo.trim();

  const squareFootageQuery = parseOptionalNumber(filters.squareFootage);
  const bedroomsQuery = parseOptionalNumber(filters.bedrooms);
  const bathroomsQuery = parseOptionalNumber(filters.bathrooms);
  const yearBuiltQuery = parseOptionalNumber(filters.yearBuilt);
  const lotSizeQuery = parseOptionalNumber(filters.lotSize);
  const distanceQuery = parseOptionalNumber(filters.distanceToCityCenter);
  const schoolRatingQuery = parseOptionalNumber(filters.schoolRating);
  const predictedPriceQuery = parseOptionalNumber(filters.predictionPrice);

  return records.filter((item) => {
    if (idQuery.length > 0 && !item.id.toLowerCase().includes(idQuery)) {
      return false;
    }

    if (titleQuery.length > 0 && !item.title.toLowerCase().includes(titleQuery)) {
      return false;
    }

    if (locationQuery.length > 0 && !item.location.toLowerCase().includes(locationQuery)) {
      return false;
    }

    if (createDateFromQuery.length > 0 || createDateToQuery.length > 0) {
      const recordDate = toLocalDateKey(item.createdAt) || item.createdAt.slice(0, 10);

      if (createDateFromQuery.length > 0 && recordDate < createDateFromQuery) {
        return false;
      }

      if (createDateToQuery.length > 0 && recordDate > createDateToQuery) {
        return false;
      }
    }

    if (squareFootageQuery !== null && item.features.squareFootage !== squareFootageQuery) {
      return false;
    }

    if (bedroomsQuery !== null && item.features.bedrooms !== bedroomsQuery) {
      return false;
    }

    if (bathroomsQuery !== null && item.features.bathrooms !== bathroomsQuery) {
      return false;
    }

    if (yearBuiltQuery !== null && item.features.yearBuilt !== yearBuiltQuery) {
      return false;
    }

    if (lotSizeQuery !== null && item.features.lotSize !== lotSizeQuery) {
      return false;
    }

    if (distanceQuery !== null && item.features.distanceToCityCenter !== distanceQuery) {
      return false;
    }

    if (schoolRatingQuery !== null && item.features.schoolRating !== schoolRatingQuery) {
      return false;
    }

    if (predictedPriceQuery !== null && (item.predictedPrice === null || item.predictedPrice !== predictedPriceQuery)) {
      return false;
    }

    return true;
  });
}
