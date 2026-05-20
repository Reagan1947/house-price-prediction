"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RefreshCw } from "lucide-react";
import type { PortalApp } from "@/lib/portal/types";
import { getPortalApplications } from "@/lib/portal/services";
import { ApplicationFilterBar } from "./application-filter-bar";
import { ApplicationGrid } from "./application-grid";

type LoadState = {
  isLoading: boolean;
  error?: string;
  items: PortalApp[];
  total: number;
};

const DEFAULT_ERROR = "Failed to load applications. Please try again.";

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return DEFAULT_ERROR;
}

export function PortalApplications() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const queryKeyword = searchParams.get("keyword") ?? "";
  const queryCategory = searchParams.get("category") ?? "";

  const [keyword, setKeyword] = useState(queryKeyword);
  const [category, setCategory] = useState(queryCategory);
  const [state, setState] = useState<LoadState>({
    isLoading: true,
    items: [],
    total: 0,
  });

  useEffect(() => {
    setKeyword(queryKeyword);
    setCategory(queryCategory);
  }, [queryCategory, queryKeyword]);

  const loadApplications = useCallback(async (nextKeyword: string, nextCategory: string) => {
    setState((current) => ({ ...current, isLoading: true, error: undefined }));

    try {
      const data = await getPortalApplications({
        keyword: nextKeyword,
        category: nextCategory,
      });

      setState({
        isLoading: false,
        items: data.applications,
        total: data.total,
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        isLoading: false,
        error: toErrorMessage(error),
      }));
    }
  }, []);

  useEffect(() => {
    void loadApplications(queryKeyword, queryCategory);
  }, [loadApplications, queryCategory, queryKeyword]);

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (keyword.trim().length > 0) {
      params.set("keyword", keyword.trim());
    } else {
      params.delete("keyword");
    }

    if (category.trim().length > 0) {
      params.set("category", category.trim());
    } else {
      params.delete("category");
    }

    const query = params.toString();
    router.replace(query.length > 0 ? `${pathname}?${query}` : pathname);
  };

  const resetFilters = () => {
    setKeyword("");
    setCategory("");
    router.replace(pathname);
  };

  return (
    <section className="portal-applications" aria-labelledby="portal-applications-title">
      <header className="portal-page-head">
        <h1 className="portal-page-title" id="portal-applications-title">
          Applications
        </h1>
        <p className="portal-page-subtitle">
          Browse and filter applications available to your account.
        </p>
      </header>

      <ApplicationFilterBar
        keyword={keyword}
        category={category}
        onKeywordChange={setKeyword}
        onCategoryChange={setCategory}
        onApply={applyFilters}
        onReset={resetFilters}
        isLoading={state.isLoading}
      />

      {state.error ? (
        <div className="portal-section-feedback" role="alert">
          <p>{state.error}</p>
          <button
            type="button"
            className="portal-inline-btn"
            onClick={() => {
              void loadApplications(queryKeyword, queryCategory);
            }}
          >
            <RefreshCw aria-hidden size={14} />
            Retry
          </button>
        </div>
      ) : null}

      <ApplicationGrid applications={state.items} isLoading={state.isLoading} />
    </section>
  );
}
