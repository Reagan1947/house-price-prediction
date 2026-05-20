export type ValuationTab = "prediction" | "history" | "comparison";

export type ValuationFeatureInput = {
  squareFootage: number;
  bedrooms: number;
  bathrooms: number;
  yearBuilt: number;
  lotSize: number;
  distanceToCityCenter: number;
  schoolRating: number;
};

export type PredictionRecord = {
  id: string;
  title: string;
  location: string;
  features: ValuationFeatureInput;
  predictedPrice: number | null;
  predictedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PredictionListQuery = {
  page?: number;
  size?: number;
  keyword?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
};

export type PredictionListResult = {
  items: PredictionRecord[];
  total: number;
  page?: number;
  size?: number;
  totalPages?: number;
};

export type PredictionCreatePayload = {
  title: string;
  location: string;
  features: ValuationFeatureInput;
  predictedPrice: number;
};

export type CompareFilterInput = {
  keyword?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  bedroomsMin?: number;
  bedroomsMax?: number;
  bathroomsMin?: number;
  bathroomsMax?: number;
  yearBuiltMin?: number;
  yearBuiltMax?: number;
  schoolRatingMin?: number;
  schoolRatingMax?: number;
};

export type CompareSelection = {
  recordIds: string[];
};

export type ComparisonSeries = {
  recordId: string;
  title: string;
  location?: string;
  predictedPrice: number;
  features: ValuationFeatureInput;
};
