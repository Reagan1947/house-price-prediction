import type { CompareFilterInput, PredictionRecord } from "./types";

export type CompareFilterDraft = {
  keyword: string;
  location: string;
  minPrice: string;
  maxPrice: string;
  bedroomsMin: string;
  bedroomsMax: string;
  bathroomsMin: string;
  bathroomsMax: string;
  yearBuiltMin: string;
  yearBuiltMax: string;
  schoolRatingMin: string;
  schoolRatingMax: string;
};

export type CompareFilterField = keyof CompareFilterDraft;
export type CompareFilterErrors = Partial<Record<CompareFilterField, string>>;

export const EMPTY_COMPARE_FILTER_DRAFT: CompareFilterDraft = {
  keyword: "",
  location: "",
  minPrice: "",
  maxPrice: "",
  bedroomsMin: "",
  bedroomsMax: "",
  bathroomsMin: "",
  bathroomsMax: "",
  yearBuiltMin: "",
  yearBuiltMax: "",
  schoolRatingMin: "",
  schoolRatingMax: "",
};

const RANGE_PAIRS: Array<{ min: CompareFilterField; max: CompareFilterField; label: string }> = [
  { min: "minPrice", max: "maxPrice", label: "Price" },
  { min: "bedroomsMin", max: "bedroomsMax", label: "Bedrooms" },
  { min: "bathroomsMin", max: "bathroomsMax", label: "Bathrooms" },
  { min: "yearBuiltMin", max: "yearBuiltMax", label: "Year built" },
  { min: "schoolRatingMin", max: "schoolRatingMax", label: "School rating" },
];

function normalizeText(input: string): string {
  return input.trim().toLowerCase();
}

function parseOptionalNumber(input: string): number | undefined {
  const value = input.trim();
  if (value.length === 0) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isInvalidNumber(input: string): boolean {
  return input.trim().length > 0 && parseOptionalNumber(input) === undefined;
}

function inRange(value: number, min?: number, max?: number): boolean {
  if (min !== undefined && value < min) {
    return false;
  }

  if (max !== undefined && value > max) {
    return false;
  }

  return true;
}

export function validateCompareFilterDraft(draft: CompareFilterDraft): {
  filters: CompareFilterInput;
  errors: CompareFilterErrors;
} {
  const errors: CompareFilterErrors = {};

  (Object.keys(draft) as CompareFilterField[]).forEach((field) => {
    if ((field === "keyword" || field === "location")) {
      return;
    }

    if (isInvalidNumber(draft[field])) {
      errors[field] = "Enter a valid number.";
    }
  });

  RANGE_PAIRS.forEach(({ min, max, label }) => {
    const minValue = parseOptionalNumber(draft[min]);
    const maxValue = parseOptionalNumber(draft[max]);

    if (minValue !== undefined && maxValue !== undefined && minValue > maxValue) {
      errors[max] = `${label} maximum must be greater than or equal to minimum.`;
    }
  });

  return {
    errors,
    filters: {
      keyword: draft.keyword.trim() || undefined,
      location: draft.location.trim() || undefined,
      minPrice: parseOptionalNumber(draft.minPrice),
      maxPrice: parseOptionalNumber(draft.maxPrice),
      bedroomsMin: parseOptionalNumber(draft.bedroomsMin),
      bedroomsMax: parseOptionalNumber(draft.bedroomsMax),
      bathroomsMin: parseOptionalNumber(draft.bathroomsMin),
      bathroomsMax: parseOptionalNumber(draft.bathroomsMax),
      yearBuiltMin: parseOptionalNumber(draft.yearBuiltMin),
      yearBuiltMax: parseOptionalNumber(draft.yearBuiltMax),
      schoolRatingMin: parseOptionalNumber(draft.schoolRatingMin),
      schoolRatingMax: parseOptionalNumber(draft.schoolRatingMax),
    },
  };
}

export function hasCompareFilterErrors(errors: CompareFilterErrors): boolean {
  return Object.values(errors).some(Boolean);
}

export function filterCompareCandidates(records: PredictionRecord[], filters: CompareFilterInput): PredictionRecord[] {
  const keyword = normalizeText(filters.keyword ?? "");
  const location = normalizeText(filters.location ?? "");

  return records.filter((record) => {
    if (keyword.length > 0) {
      const haystack = `${record.id} ${record.title}`.toLowerCase();
      if (!haystack.includes(keyword)) {
        return false;
      }
    }

    if (location.length > 0 && !record.location.toLowerCase().includes(location)) {
      return false;
    }

    if ((filters.minPrice !== undefined || filters.maxPrice !== undefined)) {
      if (record.predictedPrice === null || !inRange(record.predictedPrice, filters.minPrice, filters.maxPrice)) {
        return false;
      }
    }

    if (!inRange(record.features.bedrooms, filters.bedroomsMin, filters.bedroomsMax)) {
      return false;
    }

    if (!inRange(record.features.bathrooms, filters.bathroomsMin, filters.bathroomsMax)) {
      return false;
    }

    if (!inRange(record.features.yearBuilt, filters.yearBuiltMin, filters.yearBuiltMax)) {
      return false;
    }

    if (!inRange(record.features.schoolRating, filters.schoolRatingMin, filters.schoolRatingMax)) {
      return false;
    }

    return true;
  });
}

export function sortCompareCandidates(records: PredictionRecord[]): PredictionRecord[] {
  return [...records].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();

    if (Number.isNaN(aTime) || Number.isNaN(bTime)) {
      return b.createdAt.localeCompare(a.createdAt);
    }

    return bTime - aTime;
  });
}
