import type { PredictionRecord } from "@/lib/valuation/types";
import type { AnalysisFilterInput, AnalysisSegmentGroupKey } from "./types";

export type SegmentBucket = {
  groupKey: string;
  group: string;
  sortValue: number;
  filterPatch: Partial<AnalysisFilterInput>;
};

function schoolRatingBandUpper(lower: number): number {
  return lower === 8 ? 10 : lower + 2;
}

function schoolRatingBandLabel(lower: number): string {
  const upper = schoolRatingBandUpper(lower);
  return `${lower}-${upper}`;
}

export function getSchoolRatingBand(value: number): SegmentBucket {
  const clamped = Math.max(0, Math.min(10, value));
  const lower = clamped >= 8 ? 8 : Math.floor(clamped / 2) * 2;
  const upper = schoolRatingBandUpper(lower);

  return {
    groupKey: String(lower),
    group: schoolRatingBandLabel(lower),
    sortValue: lower,
    filterPatch: {
      schoolRatingMin: lower,
      schoolRatingMax: upper === 10 ? 10 : upper - 0.001,
    },
  };
}

export function getDistanceBand(value: number): SegmentBucket {
  const lower = Math.max(0, Math.floor(Math.max(0, value) / 2) * 2);
  const upper = lower + 2;

  return {
    groupKey: String(lower),
    group: `${lower}-${upper}`,
    sortValue: lower,
    filterPatch: {
      distanceToCityCenterMin: lower,
      distanceToCityCenterMax: upper - 0.001,
    },
  };
}

export function getSegmentBucket(
  record: PredictionRecord,
  groupBy: AnalysisSegmentGroupKey,
): SegmentBucket {
  switch (groupBy) {
    case "bedrooms": {
      const bedrooms = record.features.bedrooms;
      return {
        groupKey: String(bedrooms),
        group: String(bedrooms),
        sortValue: bedrooms,
        filterPatch: { bedroomsMin: bedrooms, bedroomsMax: bedrooms },
      };
    }
    case "bathrooms": {
      const bathrooms = record.features.bathrooms;
      return {
        groupKey: String(bathrooms),
        group: String(bathrooms),
        sortValue: bathrooms,
        filterPatch: { bathroomsMin: bathrooms, bathroomsMax: bathrooms },
      };
    }
    case "year_built_decade": {
      const decade = Math.floor(record.features.yearBuilt / 10) * 10;
      return {
        groupKey: String(decade),
        group: `${decade}s`,
        sortValue: decade,
        filterPatch: { yearBuiltMin: decade, yearBuiltMax: decade + 9 },
      };
    }
    case "school_rating_band":
      return getSchoolRatingBand(record.features.schoolRating);
    case "distance_band":
      return getDistanceBand(record.features.distanceToCityCenter);
    default:
      return getDistanceBand(record.features.distanceToCityCenter);
  }
}

export function buildSegmentFilterPatch(
  segmentDimension: AnalysisSegmentGroupKey,
  groupKey: string,
): Partial<AnalysisFilterInput> {
  switch (segmentDimension) {
    case "bedrooms": {
      const bedrooms = Number(groupKey);
      if (!Number.isFinite(bedrooms)) {
        return {};
      }
      return { bedroomsMin: bedrooms, bedroomsMax: bedrooms };
    }
    case "bathrooms": {
      const bathrooms = Number(groupKey);
      if (!Number.isFinite(bathrooms)) {
        return {};
      }
      return { bathroomsMin: bathrooms, bathroomsMax: bathrooms };
    }
    case "year_built_decade": {
      const decade = Number(groupKey);
      if (!Number.isFinite(decade)) {
        return {};
      }
      return { yearBuiltMin: decade, yearBuiltMax: decade + 9 };
    }
    case "school_rating_band": {
      const lower = Number(groupKey);
      if (!Number.isFinite(lower)) {
        return {};
      }
      const upper = schoolRatingBandUpper(lower);
      return {
        schoolRatingMin: lower,
        schoolRatingMax: upper === 10 ? 10 : upper - 0.001,
      };
    }
    case "distance_band": {
      const lower = Number(groupKey);
      if (!Number.isFinite(lower)) {
        return {};
      }
      return {
        distanceToCityCenterMin: lower,
        distanceToCityCenterMax: lower + 2 - 0.001,
      };
    }
    default:
      return {};
  }
}
