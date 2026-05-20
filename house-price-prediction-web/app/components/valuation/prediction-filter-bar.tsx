"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { format, parseISO } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type PredictionFilters = {
  id: string;
  title: string;
  location: string;
  createDateFrom: string;
  createDateTo: string;
  squareFootage: string;
  bedrooms: string;
  bathrooms: string;
  yearBuilt: string;
  lotSize: string;
  distanceToCityCenter: string;
  schoolRating: string;
  predictionPrice: string;
};

type PredictionFilterBarProps = {
  filters: PredictionFilters;
  onFilterChange: <K extends keyof PredictionFilters>(key: K, value: PredictionFilters[K]) => void;
  onApply: () => void;
  onReset: () => void;
  onCreate?: () => void;
  isLoading: boolean;
};

function parseDate(value: string): Date | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function formatDateKey(value: Date | undefined): string {
  if (!value) {
    return "";
  }

  return format(value, "yyyy-MM-dd");
}

export function PredictionFilterBar({
  filters,
  onFilterChange,
  onApply,
  onReset,
  onCreate,
  isLoading,
}: PredictionFilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onApply();
  };

  const selectedRange: DateRange | undefined =
    filters.createDateFrom || filters.createDateTo
      ? {
          from: parseDate(filters.createDateFrom),
          to: parseDate(filters.createDateTo),
        }
      : undefined;

  const dateRangeLabel =
    selectedRange?.from && selectedRange?.to
      ? `${format(selectedRange.from, "MMM dd, yyyy")} - ${format(selectedRange.to, "MMM dd, yyyy")}`
      : selectedRange?.from
        ? `${format(selectedRange.from, "MMM dd, yyyy")} -`
        : "Pick date range";
  const isDateRangePlaceholder = !selectedRange?.from;

  return (
    <form className="valuation-filter-bar valuation-prediction-filter-bar" onSubmit={handleSubmit} aria-label="Prediction filters">
      <div className="valuation-prediction-filter-primary-row">
        <label className="valuation-filter-field valuation-filter-field-id">
          <span>ID</span>
          <input
            className="valuation-filter-input"
            type="search"
            value={filters.id}
            onChange={(event) => onFilterChange("id", event.target.value)}
            placeholder="Search by prediction ID"
          />
        </label>

        <label className="valuation-filter-field valuation-filter-field-text">
          <span>Title</span>
          <input
            className="valuation-filter-input"
            type="search"
            value={filters.title}
            onChange={(event) => onFilterChange("title", event.target.value)}
            placeholder="Search by title"
          />
        </label>

        <label className="valuation-filter-field valuation-filter-field-text">
          <span>Location</span>
          <input
            className="valuation-filter-input"
            type="search"
            value={filters.location}
            onChange={(event) => onFilterChange("location", event.target.value)}
            placeholder="Search by location"
          />
        </label>

        <div className="valuation-filter-actions valuation-prediction-filter-primary-actions">
          <button type="submit" className="valuation-btn valuation-btn-primary" disabled={isLoading}>
            {isLoading ? "Searching..." : "Search"}
          </button>
          <button type="button" className="valuation-btn valuation-btn-secondary" onClick={onReset} disabled={isLoading}>
            Reset
          </button>
          <button
            type="button"
            className="valuation-advance-trigger"
            onClick={() => setShowAdvanced((current) => !current)}
            aria-expanded={showAdvanced}
            aria-controls="valuation-advanced-filters"
          >
            {showAdvanced ? "Basic" : "Advance"}
          </button>
        </div>
      </div>

      <div
        id="valuation-advanced-filters"
        className="valuation-prediction-filter-grid valuation-prediction-filter-grid-advanced"
        hidden={!showAdvanced}
      >
        {showAdvanced ? (
          <>
            <div className="valuation-filter-field valuation-filter-field-date-range">
              <span>Create Date Range</span>
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="valuation-filter-input valuation-date-range-trigger w-full text-left font-normal tracking-[0.16px]"
                  >
                    <span className={isDateRangePlaceholder ? "valuation-date-range-placeholder" : undefined}>
                      {dateRangeLabel}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="valuation-date-range-popover w-auto p-0" align="start" sideOffset={8}>
                  <Calendar
                    mode="range"
                    defaultMonth={selectedRange?.from}
                    selected={selectedRange}
                    onSelect={(range) => {
                      onFilterChange("createDateFrom", formatDateKey(range?.from));
                      onFilterChange("createDateTo", formatDateKey(range?.to));
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <label className="valuation-filter-field valuation-filter-field-number">
              <span>Square Footage</span>
              <input
                className="valuation-filter-input"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={filters.squareFootage}
                onChange={(event) => onFilterChange("squareFootage", event.target.value)}
                placeholder="e.g. 1800"
              />
            </label>

            <label className="valuation-filter-field valuation-filter-field-number">
              <span>Bedrooms</span>
              <input
                className="valuation-filter-input"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={filters.bedrooms}
                onChange={(event) => onFilterChange("bedrooms", event.target.value)}
                placeholder="e.g. 3"
              />
            </label>

            <label className="valuation-filter-field valuation-filter-field-number">
              <span>Bathrooms</span>
              <input
                className="valuation-filter-input"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.5"
                value={filters.bathrooms}
                onChange={(event) => onFilterChange("bathrooms", event.target.value)}
                placeholder="e.g. 2.5"
              />
            </label>

            <label className="valuation-filter-field valuation-filter-field-number">
              <span>Year Built</span>
              <input
                className="valuation-filter-input"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={filters.yearBuilt}
                onChange={(event) => onFilterChange("yearBuilt", event.target.value)}
                placeholder="e.g. 2010"
              />
            </label>

            <label className="valuation-filter-field valuation-filter-field-number">
              <span>Lot Size</span>
              <input
                className="valuation-filter-input"
                type="number"
                inputMode="decimal"
                min={0}
                step={1}
                value={filters.lotSize}
                onChange={(event) => onFilterChange("lotSize", event.target.value)}
                placeholder="e.g. 5500"
              />
            </label>

            <label className="valuation-filter-field valuation-filter-field-number">
              <span>Distance to City Center</span>
              <input
                className="valuation-filter-input"
                type="number"
                inputMode="decimal"
                min={0}
                step={0.1}
                value={filters.distanceToCityCenter}
                onChange={(event) => onFilterChange("distanceToCityCenter", event.target.value)}
                placeholder="e.g. 12.5"
              />
            </label>

            <label className="valuation-filter-field valuation-filter-field-number">
              <span>School Rating</span>
              <input
                className="valuation-filter-input"
                type="number"
                inputMode="decimal"
                min={0}
                step={0.1}
                value={filters.schoolRating}
                onChange={(event) => onFilterChange("schoolRating", event.target.value)}
                placeholder="e.g. 8.2"
              />
            </label>

            <label className="valuation-filter-field valuation-filter-field-number">
              <span>Prediction Price</span>
              <input
                className="valuation-filter-input"
                type="number"
                inputMode="decimal"
                min={0}
                step={1}
                value={filters.predictionPrice}
                onChange={(event) => onFilterChange("predictionPrice", event.target.value)}
                placeholder="e.g. 650000"
              />
            </label>
          </>
        ) : null}
      </div>

      {onCreate ? (
        <div className="valuation-filter-actions valuation-prediction-filter-actions">
          <button type="button" className="valuation-btn valuation-btn-primary" onClick={onCreate}>
            Create Prediction
          </button>
        </div>
      ) : null}
    </form>
  );
}
