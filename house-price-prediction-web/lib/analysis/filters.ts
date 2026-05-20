import {
  ANALYSIS_FEATURE_DIMENSIONS,
  inferActiveDimensions,
  isAnalysisRangeDimensionId,
} from "./filter-dimensions";
import { SEGMENT_DIMENSIONS } from "./segments-api";
import type {
  AnalysisFilterInput,
  AnalysisRangeDimensionId,
  AnalysisSegmentGroupKey,
  AnalysisTab,
  PropertyType,
} from "./types";

export type AnalysisFilterDraft = {
  keyword: string;
  region: string;
  propertyType: string;
  /** One entry per filter row; empty string means the user has not chosen a field yet. */
  dimensionRowSelections: (AnalysisRangeDimensionId | "")[];
  squareFootageMin: string;
  squareFootageMax: string;
  bedroomsMin: string;
  bedroomsMax: string;
  bathroomsMin: string;
  bathroomsMax: string;
  yearBuiltMin: string;
  yearBuiltMax: string;
  lotSizeMin: string;
  lotSizeMax: string;
  distanceToCityCenterMin: string;
  distanceToCityCenterMax: string;
  schoolRatingMin: string;
  schoolRatingMax: string;
};

type RangeDraftField = `${AnalysisRangeDimensionId}Min` | `${AnalysisRangeDimensionId}Max`;

export type AnalysisFilterField = keyof AnalysisFilterDraft;
export type AnalysisFilterErrors = Partial<Record<RangeDraftField, string>>;

export function sanitizeRangeFilterInput(raw: string, integer: boolean): string {
  if (!raw) {
    return "";
  }

  if (integer) {
    return raw.replace(/\D/g, "");
  }

  let sanitized = "";
  let hasDecimalSeparator = false;

  for (const character of raw) {
    if (character >= "0" && character <= "9") {
      sanitized += character;
      continue;
    }

    if (character === "." && !hasDecimalSeparator) {
      hasDecimalSeparator = true;
      sanitized += character;
    }
  }

  return sanitized;
}

export const EMPTY_ANALYSIS_FILTER_DRAFT: AnalysisFilterDraft = {
  keyword: "",
  region: "",
  propertyType: "",
  dimensionRowSelections: [""],
  squareFootageMin: "",
  squareFootageMax: "",
  bedroomsMin: "",
  bedroomsMax: "",
  bathroomsMin: "",
  bathroomsMax: "",
  yearBuiltMin: "",
  yearBuiltMax: "",
  lotSizeMin: "",
  lotSizeMax: "",
  distanceToCityCenterMin: "",
  distanceToCityCenterMax: "",
  schoolRatingMin: "",
  schoolRatingMax: "",
};

function getSelectedDimensionIds(
  selections: (AnalysisRangeDimensionId | "")[],
): AnalysisRangeDimensionId[] {
  return selections.filter((dimensionId): dimensionId is AnalysisRangeDimensionId => Boolean(dimensionId));
}

export function resetDimensionFilterDraft(draft: AnalysisFilterDraft): AnalysisFilterDraft {
  return {
    ...draft,
    dimensionRowSelections: [""],
    squareFootageMin: "",
    squareFootageMax: "",
    bedroomsMin: "",
    bedroomsMax: "",
    bathroomsMin: "",
    bathroomsMax: "",
    yearBuiltMin: "",
    yearBuiltMax: "",
    lotSizeMin: "",
    lotSizeMax: "",
    distanceToCityCenterMin: "",
    distanceToCityCenterMax: "",
    schoolRatingMin: "",
    schoolRatingMax: "",
  };
}

const TAB_SET = new Set<AnalysisTab>(["dashboard", "segments", "scenarios", "data"]);

const PROPERTY_TYPES = new Set<PropertyType>(["apartment", "house", "villa", "townhouse"]);

const RANGE_DRAFT_FIELDS: Record<AnalysisRangeDimensionId, { min: RangeDraftField; max: RangeDraftField }> = {
  squareFootage: { min: "squareFootageMin", max: "squareFootageMax" },
  bedrooms: { min: "bedroomsMin", max: "bedroomsMax" },
  bathrooms: { min: "bathroomsMin", max: "bathroomsMax" },
  yearBuilt: { min: "yearBuiltMin", max: "yearBuiltMax" },
  lotSize: { min: "lotSizeMin", max: "lotSizeMax" },
  distanceToCityCenter: { min: "distanceToCityCenterMin", max: "distanceToCityCenterMax" },
  schoolRating: { min: "schoolRatingMin", max: "schoolRatingMax" },
};

const FILTER_PARAM_KEYS = [
  "keyword",
  "region",
  "propertyType",
  "dims",
  "squareFootageMin",
  "squareFootageMax",
  "bedroomsMin",
  "bedroomsMax",
  "bathroomsMin",
  "bathroomsMax",
  "yearBuiltMin",
  "yearBuiltMax",
  "lotSizeMin",
  "lotSizeMax",
  "distanceToCityCenterMin",
  "distanceToCityCenterMax",
  "priceMin",
  "priceMax",
  "schoolRatingMin",
  "schoolRatingMax",
  "sort",
  "order",
  "page",
  "size",
  "highlightId",
] as const;

function readParam(params: URLSearchParams, key: string): string | undefined {
  const value = params.get(key);
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

function parseOptionalInt(input: string | undefined): number | undefined {
  if (!input) {
    return undefined;
  }

  const parsed = Number(input);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return Math.trunc(parsed);
}

function parseOptionalNumber(input: string | undefined): number | undefined {
  if (!input) {
    return undefined;
  }

  const parsed = Number(input);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isInvalidNumber(input: string): boolean {
  return input.trim().length > 0 && parseOptionalNumber(input) === undefined;
}

function parseRangeParam(
  params: URLSearchParams,
  key: string,
  integer: boolean,
): { value?: number; ignored: boolean } {
  const raw = readParam(params, key);
  if (!raw) {
    return { ignored: false };
  }

  const value = integer ? parseOptionalInt(raw) : parseOptionalNumber(raw);
  if (value === undefined) {
    return { ignored: true };
  }

  return { value, ignored: false };
}

function assignRangeFilter(
  filters: AnalysisFilterInput,
  key: keyof AnalysisFilterInput,
  value: number | undefined,
): void {
  if (value !== undefined) {
    (filters as Record<string, number>)[key as string] = value;
  }
}

function parseActiveDimensionsParam(raw: string | undefined): AnalysisRangeDimensionId[] | null {
  if (!raw) {
    return null;
  }

  const parsed = raw
    .split(",")
    .map((item) => item.trim())
    .filter((item) => isAnalysisRangeDimensionId(item));

  return parsed.length > 0 ? parsed : [];
}

export function normalizeAnalysisTab(tab: string | null | undefined): AnalysisTab {
  if (tab && TAB_SET.has(tab as AnalysisTab)) {
    return tab as AnalysisTab;
  }

  return "dashboard";
}

export function normalizeAnalysisSegmentDimension(
  value: string | null | undefined,
): AnalysisSegmentGroupKey | undefined {
  if (value && SEGMENT_DIMENSIONS.has(value as AnalysisSegmentGroupKey)) {
    return value as AnalysisSegmentGroupKey;
  }

  return undefined;
}

export function parseAnalysisSearchParams(
  params: URLSearchParams,
): {
  filters: AnalysisFilterInput;
  ignored: boolean;
  tab: AnalysisTab;
  segmentDimension?: AnalysisSegmentGroupKey;
} {
  let ignored = false;
  const filters: AnalysisFilterInput = {};

  const keyword = readParam(params, "keyword");
  if (keyword) {
    filters.keyword = keyword;
  }

  const regionRaw = readParam(params, "region");
  if (regionRaw) {
    filters.region = regionRaw.split(",").map((item) => item.trim()).filter(Boolean);
  }

  const propertyType = readParam(params, "propertyType");
  if (propertyType) {
    if (PROPERTY_TYPES.has(propertyType as PropertyType)) {
      filters.propertyType = propertyType as PropertyType;
    } else {
      ignored = true;
    }
  }

  const activeDimensions = parseActiveDimensionsParam(readParam(params, "dims"));
  if (activeDimensions) {
    filters.activeDimensions = activeDimensions;
  }

  for (const dimension of ANALYSIS_FEATURE_DIMENSIONS) {
    const minResult = parseRangeParam(params, dimension.minKey as string, Boolean(dimension.integer));
    const maxResult = parseRangeParam(params, dimension.maxKey as string, Boolean(dimension.integer));

    if (minResult.ignored || maxResult.ignored) {
      ignored = true;
    }

    assignRangeFilter(filters, dimension.minKey, minResult.value);
    assignRangeFilter(filters, dimension.maxKey, maxResult.value);
  }

  const priceMin = parseOptionalNumber(readParam(params, "priceMin"));
  const priceMax = parseOptionalNumber(readParam(params, "priceMax"));
  if (readParam(params, "priceMin") && priceMin === undefined) {
    ignored = true;
  } else if (priceMin !== undefined) {
    filters.priceMin = priceMin;
  }
  if (readParam(params, "priceMax") && priceMax === undefined) {
    ignored = true;
  } else if (priceMax !== undefined) {
    filters.priceMax = priceMax;
  }

  const sort = readParam(params, "sort");
  if (sort) {
    filters.sort = sort;
  }

  const order = readParam(params, "order");
  if (order === "asc" || order === "desc") {
    filters.order = order;
  } else if (order) {
    ignored = true;
  }

  const page = parseOptionalInt(readParam(params, "page"));
  if (readParam(params, "page") && (page === undefined || page < 1)) {
    ignored = true;
  } else if (page !== undefined) {
    filters.page = page;
  }

  const size = parseOptionalInt(readParam(params, "size"));
  if (size === 10 || size === 20 || size === 50) {
    filters.size = size;
  } else if (readParam(params, "size")) {
    ignored = true;
  }

  const highlightId = readParam(params, "highlightId");
  if (highlightId) {
    filters.highlightId = highlightId;
  }

  const tab = normalizeAnalysisTab(readParam(params, "tab"));

  const segmentDimensionRaw = readParam(params, "segmentDimension");
  const segmentDimension = normalizeAnalysisSegmentDimension(segmentDimensionRaw);
  if (segmentDimensionRaw && !segmentDimension) {
    ignored = true;
  }

  return { filters, ignored, tab, segmentDimension };
}

export function validateAnalysisFilterDraft(draft: AnalysisFilterDraft): {
  filters: AnalysisFilterInput;
  errors: AnalysisFilterErrors;
} {
  const errors: AnalysisFilterErrors = {};
  const selectedDimensions = getSelectedDimensionIds(draft.dimensionRowSelections);
  const activeSet = new Set(selectedDimensions);

  selectedDimensions.forEach((dimensionId) => {
    const fields = RANGE_DRAFT_FIELDS[dimensionId];
    const minRaw = draft[fields.min];
    const maxRaw = draft[fields.max];
    const dimension = ANALYSIS_FEATURE_DIMENSIONS.find((item) => item.id === dimensionId);
    const label = dimension?.label ?? dimensionId;

    if (isInvalidNumber(minRaw)) {
      errors[fields.min] = "Enter a valid number.";
    }

    if (isInvalidNumber(maxRaw)) {
      errors[fields.max] = "Enter a valid number.";
    }

    const parseValue = dimension?.integer ? parseOptionalInt : parseOptionalNumber;
    const minValue = parseValue(minRaw);
    const maxValue = parseValue(maxRaw);

    if (minValue !== undefined && maxValue !== undefined && minValue > maxValue) {
      errors[fields.max] = `${label} maximum must be greater than or equal to minimum.`;
    }
  });

  const propertyType = draft.propertyType.trim();
  const filters: AnalysisFilterInput = {
    keyword: draft.keyword.trim() || undefined,
    region: draft.region.trim()
      ? draft.region.split(",").map((item) => item.trim()).filter(Boolean)
      : undefined,
    propertyType:
      propertyType && PROPERTY_TYPES.has(propertyType as PropertyType)
        ? (propertyType as PropertyType)
        : undefined,
    activeDimensions: selectedDimensions.length > 0 ? [...selectedDimensions] : undefined,
  };

  selectedDimensions.forEach((dimensionId) => {
    const fields = RANGE_DRAFT_FIELDS[dimensionId];
    const dimension = ANALYSIS_FEATURE_DIMENSIONS.find((item) => item.id === dimensionId);
    const parseValue = dimension?.integer ? parseOptionalInt : parseOptionalNumber;
    const minValue = parseValue(draft[fields.min]);
    const maxValue = parseValue(draft[fields.max]);

    if (!errors[fields.min] && minValue !== undefined) {
      assignRangeFilter(filters, dimension!.minKey, minValue);
    }

    if (!errors[fields.max] && maxValue !== undefined) {
      assignRangeFilter(filters, dimension!.maxKey, maxValue);
    }
  });

  // Clear inactive dimension ranges even if values remain in draft inputs.
  ANALYSIS_FEATURE_DIMENSIONS.forEach((dimension) => {
    if (!activeSet.has(dimension.id)) {
      assignRangeFilter(filters, dimension.minKey, undefined);
      assignRangeFilter(filters, dimension.maxKey, undefined);
    }
  });

  return { filters, errors };
}

export function hasAnalysisFilterErrors(errors: AnalysisFilterErrors): boolean {
  return Object.values(errors).some(Boolean);
}

export function filtersToDraft(filters: AnalysisFilterInput): AnalysisFilterDraft {
  const activeDimensions = inferActiveDimensions(filters);

  return {
    keyword: filters.keyword ?? "",
    region: filters.region?.join(", ") ?? "",
    propertyType: filters.propertyType ?? "",
    dimensionRowSelections: activeDimensions.length > 0 ? activeDimensions : [""],
    squareFootageMin:
      filters.squareFootageMin !== undefined ? String(filters.squareFootageMin) : "",
    squareFootageMax:
      filters.squareFootageMax !== undefined ? String(filters.squareFootageMax) : "",
    bedroomsMin: filters.bedroomsMin !== undefined ? String(filters.bedroomsMin) : "",
    bedroomsMax: filters.bedroomsMax !== undefined ? String(filters.bedroomsMax) : "",
    bathroomsMin: filters.bathroomsMin !== undefined ? String(filters.bathroomsMin) : "",
    bathroomsMax: filters.bathroomsMax !== undefined ? String(filters.bathroomsMax) : "",
    yearBuiltMin: filters.yearBuiltMin !== undefined ? String(filters.yearBuiltMin) : "",
    yearBuiltMax: filters.yearBuiltMax !== undefined ? String(filters.yearBuiltMax) : "",
    lotSizeMin: filters.lotSizeMin !== undefined ? String(filters.lotSizeMin) : "",
    lotSizeMax: filters.lotSizeMax !== undefined ? String(filters.lotSizeMax) : "",
    distanceToCityCenterMin:
      filters.distanceToCityCenterMin !== undefined
        ? String(filters.distanceToCityCenterMin)
        : "",
    distanceToCityCenterMax:
      filters.distanceToCityCenterMax !== undefined
        ? String(filters.distanceToCityCenterMax)
        : "",
    schoolRatingMin: filters.schoolRatingMin !== undefined ? String(filters.schoolRatingMin) : "",
    schoolRatingMax: filters.schoolRatingMax !== undefined ? String(filters.schoolRatingMax) : "",
  };
}

export function addAnalysisDimensionRow(draft: AnalysisFilterDraft): AnalysisFilterDraft {
  if (draft.dimensionRowSelections.length >= ANALYSIS_FEATURE_DIMENSIONS.length) {
    return draft;
  }

  return {
    ...draft,
    dimensionRowSelections: [...draft.dimensionRowSelections, ""],
  };
}

export function changeAnalysisDimensionRow(
  draft: AnalysisFilterDraft,
  rowIndex: number,
  dimensionId: AnalysisRangeDimensionId,
): AnalysisFilterDraft {
  const rows = [...draft.dimensionRowSelections];
  const previousId = rows[rowIndex];

  if (previousId === dimensionId) {
    return draft;
  }

  while (rows.length <= rowIndex) {
    rows.push("");
  }

  rows[rowIndex] = dimensionId;

  let next: AnalysisFilterDraft = {
    ...draft,
    dimensionRowSelections: rows,
  };

  if (previousId && previousId !== dimensionId) {
    const fields = RANGE_DRAFT_FIELDS[previousId];
    next = {
      ...next,
      [fields.min]: "",
      [fields.max]: "",
    };
  }

  return next;
}

export function removeAnalysisDimensionRow(
  draft: AnalysisFilterDraft,
  rowIndex: number,
): AnalysisFilterDraft {
  const dimensionId = draft.dimensionRowSelections[rowIndex];

  if (draft.dimensionRowSelections.length <= 1) {
    let next: AnalysisFilterDraft = {
      ...draft,
      dimensionRowSelections: [""],
    };

    if (dimensionId) {
      const fields = RANGE_DRAFT_FIELDS[dimensionId];
      next = {
        ...next,
        [fields.min]: "",
        [fields.max]: "",
      };
    }

    return next;
  }

  const nextSelections = draft.dimensionRowSelections.filter((_, index) => index !== rowIndex);

  let next: AnalysisFilterDraft = {
    ...draft,
    dimensionRowSelections: nextSelections.length > 0 ? nextSelections : [""],
  };

  if (dimensionId) {
    const fields = RANGE_DRAFT_FIELDS[dimensionId];
    next = {
      ...next,
      [fields.min]: "",
      [fields.max]: "",
    };
  }

  return next;
}

export function serializeAnalysisFilters(
  filters: AnalysisFilterInput,
  options?: { tab?: AnalysisTab; segmentDimension?: AnalysisSegmentGroupKey; preserve?: URLSearchParams },
): URLSearchParams {
  const params = new URLSearchParams(options?.preserve?.toString() ?? "");

  FILTER_PARAM_KEYS.forEach((key) => params.delete(key));
  params.delete("segmentDimension");

  if (options?.tab) {
    params.set("tab", options.tab);
  }

  if (options?.segmentDimension) {
    params.set("segmentDimension", options.segmentDimension);
  }

  if (filters.keyword) {
    params.set("keyword", filters.keyword);
  }

  if (filters.region && filters.region.length > 0) {
    params.set("region", filters.region.join(","));
  }

  if (filters.propertyType) {
    params.set("propertyType", filters.propertyType);
  }

  const activeDimensions = inferActiveDimensions(filters);
  if (activeDimensions.length > 0) {
    params.set("dims", activeDimensions.join(","));
  }

  for (const dimension of ANALYSIS_FEATURE_DIMENSIONS) {
    if (!activeDimensions.includes(dimension.id)) {
      continue;
    }

    const min = filters[dimension.minKey];
    const max = filters[dimension.maxKey];

    if (typeof min === "number") {
      params.set(dimension.minKey as string, String(min));
    }

    if (typeof max === "number") {
      params.set(dimension.maxKey as string, String(max));
    }
  }

  if (filters.priceMin !== undefined) {
    params.set("priceMin", String(filters.priceMin));
  }

  if (filters.priceMax !== undefined) {
    params.set("priceMax", String(filters.priceMax));
  }

  if (filters.sort) {
    params.set("sort", filters.sort);
  }

  if (filters.order) {
    params.set("order", filters.order);
  }

  if (filters.page !== undefined) {
    params.set("page", String(filters.page));
  }

  if (filters.size !== undefined) {
    params.set("size", String(filters.size));
  }

  if (filters.highlightId) {
    params.set("highlightId", filters.highlightId);
  }

  return params;
}

export function stripFeatureRangeFilters(filters: AnalysisFilterInput): AnalysisFilterInput {
  const next: AnalysisFilterInput = { ...filters };

  for (const dimension of ANALYSIS_FEATURE_DIMENSIONS) {
    delete next[dimension.minKey];
    delete next[dimension.maxKey];
  }

  delete next.activeDimensions;

  return next;
}

export function applyValidatedAnalysisFilters(
  base: AnalysisFilterInput,
  validated: AnalysisFilterInput,
  patch?: Partial<AnalysisFilterInput>,
): AnalysisFilterInput {
  return {
    ...stripFeatureRangeFilters(base),
    ...validated,
    ...patch,
  };
}

export function mergeAnalysisFilters(
  base: AnalysisFilterInput,
  patch: Partial<AnalysisFilterInput>,
): AnalysisFilterInput {
  return { ...base, ...patch };
}

export function clearAnalysisFilters(tab: AnalysisTab): URLSearchParams {
  return serializeAnalysisFilters({}, { tab });
}
