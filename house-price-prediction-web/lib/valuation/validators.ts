import type { ValuationFeatureInput } from "./types";

export type ValidationErrors = Partial<Record<keyof ValuationFeatureInput | "title" | "location", string>>;

export function validatePredictionForm(input: {
  title: string;
  location: string;
  features: ValuationFeatureInput;
}): ValidationErrors {
  const errors: ValidationErrors = {};

  const { title, features } = input;

  if (!title.trim()) {
    errors.title = "Title is required.";
  }

  if (!Number.isFinite(features.squareFootage) || features.squareFootage < 100 || features.squareFootage > 20000) {
    errors.squareFootage = "Square footage must be between 100 and 20000.";
  }

  if (!Number.isInteger(features.bedrooms) || features.bedrooms < 0 || features.bedrooms > 20) {
    errors.bedrooms = "Bedrooms must be an integer between 0 and 20.";
  }

  if (!Number.isFinite(features.bathrooms) || features.bathrooms < 0 || features.bathrooms > 20) {
    errors.bathrooms = "Bathrooms must be between 0 and 20.";
  }

  const currentYear = new Date().getFullYear();
  if (!Number.isInteger(features.yearBuilt) || features.yearBuilt < 1800 || features.yearBuilt > currentYear) {
    errors.yearBuilt = `Year built must be between 1800 and ${currentYear}.`;
  }

  if (!Number.isFinite(features.lotSize) || features.lotSize <= 0) {
    errors.lotSize = "Lot size must be greater than 0.";
  }

  if (!Number.isFinite(features.distanceToCityCenter) || features.distanceToCityCenter < 0) {
    errors.distanceToCityCenter = "Distance to city center must be 0 or greater.";
  }

  if (!Number.isFinite(features.schoolRating) || features.schoolRating < 0 || features.schoolRating > 10) {
    errors.schoolRating = "School rating must be between 0 and 10.";
  }

  return errors;
}

export function isValidationPassed(errors: ValidationErrors): boolean {
  return Object.keys(errors).length === 0;
}
