"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdviceItem, PortalApp, RecentActivity } from "@/lib/portal/types";
import { getPortalAdvices, getPortalRecentActivities, getPortalShortcuts } from "@/lib/portal/services";
import { ShortcutSection } from "./shortcut-section";
import { AdviceSection } from "./advice-section";
import { RecentlySection } from "./recently-section";

type LoadState<T> = {
  isLoading: boolean;
  error?: string;
  data: T;
};

const DEFAULT_ERROR = "Failed to load section data. Please try again.";

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return DEFAULT_ERROR;
}

export function PortalHome() {
  const [shortcutState, setShortcutState] = useState<LoadState<PortalApp[]>>({
    isLoading: true,
    data: [],
  });
  const [adviceState, setAdviceState] = useState<LoadState<AdviceItem[]>>({
    isLoading: true,
    data: [],
  });
  const [recentlyState, setRecentlyState] = useState<LoadState<RecentActivity[]>>({
    isLoading: true,
    data: [],
  });

  const loadShortcuts = useCallback(async () => {
    setShortcutState((current) => ({ ...current, isLoading: true, error: undefined }));
    try {
      const shortcuts = await getPortalShortcuts();
      setShortcutState({ isLoading: false, data: shortcuts });
    } catch (error) {
      setShortcutState((current) => ({
        ...current,
        isLoading: false,
        error: toErrorMessage(error),
      }));
    }
  }, []);

  const loadAdvices = useCallback(async () => {
    setAdviceState((current) => ({ ...current, isLoading: true, error: undefined }));
    try {
      const advices = await getPortalAdvices();
      setAdviceState({ isLoading: false, data: advices });
    } catch (error) {
      setAdviceState((current) => ({
        ...current,
        isLoading: false,
        error: toErrorMessage(error),
      }));
    }
  }, []);

  const loadRecently = useCallback(async () => {
    setRecentlyState((current) => ({ ...current, isLoading: true, error: undefined }));
    try {
      const activities = await getPortalRecentActivities();
      setRecentlyState({ isLoading: false, data: activities });
    } catch (error) {
      setRecentlyState((current) => ({
        ...current,
        isLoading: false,
        error: toErrorMessage(error),
      }));
    }
  }, []);

  useEffect(() => {
    void loadShortcuts();
    void loadAdvices();
    void loadRecently();
  }, [loadAdvices, loadRecently, loadShortcuts]);

  return (
    <div className="portal-home-content">
      <header className="portal-page-head">
        <h1 className="portal-page-title" id="portal-home-title">
          Home
        </h1>
        <p className="portal-page-subtitle">
          Review shortcuts, advisories, and recent activities from one place.
        </p>
      </header>
      <ShortcutSection
        shortcuts={shortcutState.data}
        isLoading={shortcutState.isLoading}
        error={shortcutState.error}
        onRetry={() => {
          void loadShortcuts();
        }}
      />

      <AdviceSection
        advices={adviceState.data}
        isLoading={adviceState.isLoading}
        error={adviceState.error}
        onRetry={() => {
          void loadAdvices();
        }}
      />

      <RecentlySection
        activities={recentlyState.data}
        isLoading={recentlyState.isLoading}
        error={recentlyState.error}
        onRetry={() => {
          void loadRecently();
        }}
      />
    </div>
  );
}
