import type { ValuationFeatureInput } from "@/lib/valuation/types";

export const FEATURE_FIELDS: Array<{
  key: keyof ValuationFeatureInput;
  label: string;
  placeholder: string;
  unit: string;
  step?: string;
}> = [
  {
    key: "squareFootage",
    label: "Square Footage",
    placeholder: "Please input the square footage",
    unit: "sq ft",
    step: "1",
  },
  {
    key: "bedrooms",
    label: "Bedrooms",
    placeholder: "Please input bedrooms",
    unit: "rooms",
    step: "1",
  },
  {
    key: "bathrooms",
    label: "Bathrooms",
    placeholder: "Please input bathrooms",
    unit: "rooms",
    step: "0.5",
  },
  {
    key: "yearBuilt",
    label: "Year Built",
    placeholder: "Please input year built",
    unit: "year",
    step: "1",
  },
  {
    key: "lotSize",
    label: "Lot Size",
    placeholder: "Please input lot size",
    unit: "sq ft",
    step: "1",
  },
  {
    key: "distanceToCityCenter",
    label: "Distance to City Center",
    placeholder: "Please input distance",
    unit: "km",
    step: "0.1",
  },
  {
    key: "schoolRating",
    label: "School Rating",
    placeholder: "Please input school rating",
    unit: "0-10",
    step: "0.1",
  },
];

export const BASIC_INFO_LEFT_FIELDS = FEATURE_FIELDS.slice(0, 4);

export const BASIC_INFO_RIGHT_FIELDS = FEATURE_FIELDS.slice(4);
