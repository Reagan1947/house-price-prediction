"use client";

import type { AnalysisTab } from "@/lib/analysis/types";

type AnalysisPageHeaderProps = {
  currentTab: AnalysisTab;
};

const PAGE_COPY: Record<
  AnalysisTab,
  {
    title: string;
    subtitle: string;
  }
> = {
  dashboard: {
    title: "Dashboard",
    subtitle:
      "Explore neighborhood-level trends using actual sale prices, run what-if scenarios, and export the underlying records.",
  },
  segments: {
    title: "Segments",
    subtitle:
      "Group filtered listings by dimension to compare counts and price statistics, then drill down to the dashboard.",
  },
  scenarios: {
    title: "Scenarios",
    subtitle:
      "Use median features from your current filters as a baseline, adjust property inputs, and compare predicted prices.",
  },
  data: {
    title: "Dashboard",
    subtitle:
      "Explore neighborhood-level trends using actual sale prices, run what-if scenarios, and export the underlying records.",
  },
};

export function AnalysisPageHeader({ currentTab }: AnalysisPageHeaderProps) {
  const { title, subtitle } = PAGE_COPY[currentTab];

  return (
    <header className="analysis-page-header">
      <div className="analysis-page-header-copy">
        <h1 id="analysis-page-title" className="analysis-page-title">
          {title}
        </h1>
        <p className="analysis-page-subtitle">{subtitle}</p>
      </div>
    </header>
  );
}
