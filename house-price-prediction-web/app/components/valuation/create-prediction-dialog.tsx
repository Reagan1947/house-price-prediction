"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { ValuationApiError } from "@/lib/valuation/errors";
import {
  createPrediction,
  predictValuationPrice,
} from "@/lib/valuation/services";
import type {
  PredictionRecord,
  ValuationFeatureInput,
} from "@/lib/valuation/types";
import {
  isValidationPassed,
  validatePredictionForm,
  type ValidationErrors,
} from "@/lib/valuation/validators";
import {
  BASIC_INFO_LEFT_FIELDS,
  BASIC_INFO_RIGHT_FIELDS,
  FEATURE_FIELDS,
} from "./constants";
import { ValuationConfirmDialog } from "./valuation-confirm-dialog";

type BasicInfoField = (typeof FEATURE_FIELDS)[number];

type BasicInfoFieldGroupProps = {
  fields: readonly BasicInfoField[];
  features: Record<keyof ValuationFeatureInput, string>;
  errors: ValidationErrors;
  readOnly: boolean;
  onFeatureChange: (key: keyof ValuationFeatureInput, value: string) => void;
};

function BasicInfoFieldGroup({
  fields,
  features,
  errors,
  readOnly,
  onFeatureChange,
}: BasicInfoFieldGroupProps) {
  return (
    <div className="valuation-dialog-basic-info-col">
      {fields.map((field) => {
        const inputId = `valuation-feature-${field.key}`;

        return (
          <label key={field.key} className="valuation-dialog-field" htmlFor={inputId}>
            <span className="valuation-dialog-field-label">
              {field.label}
              <span className="valuation-dialog-required" aria-hidden="true">*</span>
            </span>
            <span className="valuation-dialog-input-with-unit">
              <input
                id={inputId}
                type="number"
                value={features[field.key]}
                onChange={(event) => onFeatureChange(field.key, event.target.value)}
                placeholder={field.placeholder}
                step={field.step ?? "1"}
                readOnly={readOnly}
                required
                aria-required="true"
                aria-invalid={Boolean(errors[field.key])}
              />
              <span className="valuation-dialog-input-unit" aria-hidden="true">
                {field.unit}
              </span>
            </span>
            {errors[field.key] ? <small>{errors[field.key]}</small> : null}
          </label>
        );
      })}
    </div>
  );
}

type CreatePredictionDialogProps = {
  open: boolean;
  heading?: string;
  readOnly?: boolean;
  defaultRecord?: PredictionRecord | null;
  onClose: () => void;
  onSaved: (record: PredictionRecord) => void;
};

type FormValue = {
  title: string;
  location: string;
  features: Record<keyof ValuationFeatureInput, string>;
};

const defaultFeatureValues: Record<keyof ValuationFeatureInput, string> = {
  squareFootage: "",
  bedrooms: "",
  bathrooms: "",
  yearBuilt: "",
  lotSize: "",
  distanceToCityCenter: "",
  schoolRating: "",
};

function toFeatureInput(features: Record<keyof ValuationFeatureInput, string>): ValuationFeatureInput {
  return {
    squareFootage: Number(features.squareFootage),
    bedrooms: Number(features.bedrooms),
    bathrooms: Number(features.bathrooms),
    yearBuilt: Number(features.yearBuilt),
    lotSize: Number(features.lotSize),
    distanceToCityCenter: Number(features.distanceToCityCenter),
    schoolRating: Number(features.schoolRating),
  };
}

function toFormValue(defaultRecord?: PredictionRecord | null): FormValue {
  if (!defaultRecord) {
    return {
      title: "",
      location: "",
      features: {
        ...defaultFeatureValues,
      },
    };
  }

  return {
    title: defaultRecord.title,
    location: defaultRecord.location,
    features: {
      squareFootage: `${defaultRecord.features.squareFootage}`,
      bedrooms: `${defaultRecord.features.bedrooms}`,
      bathrooms: `${defaultRecord.features.bathrooms}`,
      yearBuilt: `${defaultRecord.features.yearBuilt}`,
      lotSize: `${defaultRecord.features.lotSize}`,
      distanceToCityCenter: `${defaultRecord.features.distanceToCityCenter}`,
      schoolRating: `${defaultRecord.features.schoolRating}`,
    },
  };
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function CreatePredictionDialog({
  open,
  heading = "Create New House Price Prediction",
  readOnly = false,
  defaultRecord,
  onClose,
  onSaved,
}: CreatePredictionDialogProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const [form, setForm] = useState<FormValue>(toFormValue(defaultRecord));
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [predictedPrice, setPredictedPrice] = useState<number | null>(readOnly ? (defaultRecord?.predictedPrice ?? null) : null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [predictError, setPredictError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);

  const isCreateDialog = !readOnly && !defaultRecord;

  const resetFormState = useCallback(() => {
    setForm(toFormValue(null));
    setPredictedPrice(null);
    setErrors({});
    setPredictError(null);
    setSaveError(null);
  }, []);

  const requestClose = useCallback(() => {
    if (isCreateDialog) {
      setCloseConfirmOpen(true);
      return;
    }

    onClose();
  }, [isCreateDialog, onClose]);

  const handleConfirmClose = useCallback(() => {
    resetFormState();
    setCloseConfirmOpen(false);
    onClose();
  }, [onClose, resetFormState]);

  const handleCancelCloseConfirm = useCallback(() => {
    setCloseConfirmOpen(false);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const frame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (closeConfirmOpen) {
          return;
        }

        event.preventDefault();
        requestClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable.item(0);
      const last = focusable.item(focusable.length - 1);

      if (!first || !last) {
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [closeConfirmOpen, open, requestClose]);

  if (!open) {
    return null;
  }

  const handlePredict = async () => {
    setPredictError(null);

    const nextErrors = validatePredictionForm({
      title: form.title,
      location: form.location,
      features: toFeatureInput(form.features),
    });

    setErrors(nextErrors);

    if (!isValidationPassed(nextErrors)) {
      return;
    }

    setIsPredicting(true);
    try {
      const nextPrice = await predictValuationPrice(toFeatureInput(form.features));
      setPredictedPrice(nextPrice);
    } catch {
      setPredictError("Failed to predict house price. Please try again.");
    } finally {
      setIsPredicting(false);
    }
  };

  const handleSave = async () => {
    if (readOnly || predictedPrice === null) {
      return;
    }

    setSaveError(null);
    setIsSaving(true);

    try {
      const created = await createPrediction({
        title: form.title,
        location: form.location,
        features: toFeatureInput(form.features),
        predictedPrice,
      });

      resetFormState();
      onSaved(created);
    } catch (saveFailure) {
      setSaveError(
        saveFailure instanceof ValuationApiError
          ? saveFailure.message
          : "Failed to save prediction. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="valuation-dialog-overlay" role="presentation" onMouseDown={requestClose}>
        <div
          ref={dialogRef}
          className="valuation-dialog"
          role="dialog"
          aria-modal="true"
          aria-label={heading}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="valuation-dialog-header">
            <h2 className="valuation-dialog-title">{heading}</h2>
            <button ref={closeButtonRef} type="button" className="valuation-dialog-close" onClick={requestClose}>
              <X aria-hidden size={18} />
              <span className="sr-only">Close dialog</span>
            </button>
          </div>

        <div className="valuation-dialog-content">
          <section className="valuation-dialog-section" aria-label="Title and location">
            <div className="valuation-dialog-meta-grid">
              <label className="valuation-dialog-field">
                <span className="valuation-dialog-field-label">
                  Title
                  <span className="valuation-dialog-required" aria-hidden="true">*</span>
                </span>
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, title: event.target.value }));
                    setPredictedPrice(null);
                  }}
                  placeholder="Input your title"
                  readOnly={readOnly}
                  required
                  aria-required="true"
                  aria-invalid={Boolean(errors.title)}
                />
                {errors.title ? <small>{errors.title}</small> : null}
              </label>

              <label className="valuation-dialog-field">
                <span>Location</span>
                <input
                  type="text"
                  value={form.location}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, location: event.target.value }));
                    setPredictedPrice(null);
                  }}
                  placeholder="Input property location"
                  readOnly={readOnly}
                  aria-invalid={Boolean(errors.location)}
                />
                {errors.location ? <small>{errors.location}</small> : null}
              </label>
            </div>
          </section>

          <section className="valuation-dialog-section" aria-labelledby="valuation-dialog-basic-info-heading">
            <h3 id="valuation-dialog-basic-info-heading" className="valuation-dialog-section-title">
              Basic Information
            </h3>

            <div className="valuation-dialog-basic-info-grid">
              <BasicInfoFieldGroup
                fields={BASIC_INFO_LEFT_FIELDS}
                features={form.features}
                errors={errors}
                readOnly={readOnly}
                onFeatureChange={(key, value) => {
                  setForm((current) => ({
                    ...current,
                    features: {
                      ...current.features,
                      [key]: value,
                    },
                  }));
                  setPredictedPrice(null);
                }}
              />

              <BasicInfoFieldGroup
                fields={BASIC_INFO_RIGHT_FIELDS}
                features={form.features}
                errors={errors}
                readOnly={readOnly}
                onFeatureChange={(key, value) => {
                  setForm((current) => ({
                    ...current,
                    features: {
                      ...current.features,
                      [key]: value,
                    },
                  }));
                  setPredictedPrice(null);
                }}
              />
            </div>
          </section>

          <section
            className="valuation-dialog-section"
            aria-labelledby="valuation-dialog-prediction-price-heading"
          >
            <h3 id="valuation-dialog-prediction-price-heading" className="valuation-dialog-section-title">
              Prediction House Price
            </h3>

            <div
              className={`valuation-predict-result${predictedPrice === null ? " valuation-predict-result-empty" : ""}`}
              role="status"
              aria-live="polite"
            >
              {predictedPrice === null ? "Your predicted house price will show here." : formatMoney(predictedPrice)}
            </div>

            {predictError ? (
              <div className="valuation-feedback valuation-feedback-danger" role="alert">
                <p>{predictError}</p>
              </div>
            ) : null}

            {!readOnly ? (
              <div className="valuation-dialog-predict-actions">
                <button
                  type="button"
                  className="valuation-btn valuation-btn-primary"
                  onClick={handlePredict}
                  disabled={isPredicting}
                >
                  {isPredicting ? "Predicting..." : "Predict House Price"}
                </button>
              </div>
            ) : null}
          </section>
        </div>

        <div className="valuation-dialog-footer">
          {saveError ? (
            <div className="valuation-feedback valuation-feedback-danger" role="alert">
              <p>{saveError}</p>
            </div>
          ) : null}

          <button type="button" className="valuation-btn valuation-btn-secondary" onClick={requestClose}>
            Cancel
          </button>

          {!readOnly ? (
            <button
              type="button"
              className="valuation-btn valuation-btn-primary"
              onClick={() => void handleSave()}
              disabled={predictedPrice === null || isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          ) : null}
        </div>
      </div>
    </div>

      <ValuationConfirmDialog
        open={closeConfirmOpen}
        title="Close this dialog?"
        message="Closing this dialog will clear all entered house price prediction data. Are you sure you want to close?"
        cancelLabel="Keep editing"
        confirmLabel="Close"
        onConfirm={handleConfirmClose}
        onCancel={handleCancelCloseConfirm}
      />
    </>
  );
}
