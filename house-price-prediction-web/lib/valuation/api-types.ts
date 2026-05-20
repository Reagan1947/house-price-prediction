export type HouseFeaturesPayload = {
  square_footage: number;
  bedrooms: number;
  bathrooms: number;
  year_built: number;
  lot_size: number;
  distance_to_city_center: number;
  school_rating: number;
};

export type PredictResultPayload = {
  mode: "single" | "batch";
  count: number;
  prediction?: number;
  predictions: number[];
};

export type PredictionHistoryPayload = {
  id: number;
  title: string | null;
  location: string | null;
  square_footage: number;
  bedrooms: number;
  bathrooms: number;
  year_built: number;
  lot_size: number;
  distance_to_city_center: number;
  school_rating: number;
  predicted_price: number | null;
  predicted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PredictionHistoryPagePayload = {
  items: PredictionHistoryPayload[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
};

export type CreatePredictionHistoryPayload = HouseFeaturesPayload & {
  title?: string | null;
  location?: string | null;
  predicted_price?: number | null;
};
