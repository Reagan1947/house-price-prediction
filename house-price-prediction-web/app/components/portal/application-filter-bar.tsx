"use client";

import type { FormEvent } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ApplicationFilterBarProps = {
  keyword: string;
  category: string;
  onKeywordChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onApply: () => void;
  onReset: () => void;
  isLoading: boolean;
};

const ALL_CATEGORIES_VALUE = "all";

const CATEGORY_OPTIONS = [
  { value: ALL_CATEGORIES_VALUE, label: "All categories" },
  { value: "valuation", label: "Valuation" },
  { value: "analysis", label: "Analysis" },
] as const;

export function ApplicationFilterBar({
  keyword,
  category,
  onKeywordChange,
  onCategoryChange,
  onApply,
  onReset,
  isLoading,
}: ApplicationFilterBarProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onApply();
  };

  return (
    <form className="portal-filter-bar" onSubmit={handleSubmit} aria-label="Application filters">
      <label className="portal-filter-field">
        <span>Keyword</span>
        <input
          className="portal-filter-input"
          type="search"
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder="Search by application name"
        />
      </label>

      <label className="portal-filter-field">
        <span>Category</span>
        <Select
          value={category || ALL_CATEGORIES_VALUE}
          onValueChange={(value) => onCategoryChange(value === ALL_CATEGORIES_VALUE ? "" : value)}
          disabled={isLoading}
        >
          <SelectTrigger className="portal-filter-select" aria-label="Category filter">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent className="portal-filter-select-content">
            {CATEGORY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value} className="portal-filter-select-item">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <div className="portal-filter-actions">
        <button type="submit" className="portal-btn portal-btn-primary" disabled={isLoading}>
          {isLoading ? "Applying..." : "Apply"}
        </button>
        <button type="button" className="portal-btn portal-btn-secondary" onClick={onReset} disabled={isLoading}>
          Reset
        </button>
      </div>
    </form>
  );
}
