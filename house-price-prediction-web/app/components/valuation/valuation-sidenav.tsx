"use client";

import Link from "next/link";
import { CircleArrowLeft, Copy, History, LineChart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ValuationTab } from "@/lib/valuation/types";

type ValuationSidenavProps = {
  currentTab: ValuationTab;
  onTabChange: (tab: ValuationTab) => void;
};

const NAV_ITEMS: Array<{
  tab: ValuationTab;
  label: string;
  icon: typeof LineChart;
}> = [
  { tab: "prediction", label: "Prediction", icon: LineChart },
  { tab: "history", label: "History", icon: History },
  { tab: "comparison", label: "Comparation Tool", icon: Copy },
];

export function ValuationSidenav({ currentTab, onTabChange }: ValuationSidenavProps) {
  return (
    <nav className="portal-sidenav" aria-label="Valuation navigation">
      <div className="portal-sidenav-inner">
        <ul className="portal-sidenav-list">
          <li className="portal-sidenav-list-item">
            <Link href="/portal" className="portal-sidenav-link">
              <CircleArrowLeft aria-hidden size={16} />
              <span>Home Page</span>
            </Link>
          </li>

          {NAV_ITEMS.map((item) => {
            const isActive = item.tab === currentTab;
            const Icon = item.icon;

            return (
              <li key={item.tab} className="portal-sidenav-list-item">
                <button
                  type="button"
                  className={cn("portal-sidenav-link", isActive && "portal-sidenav-link-active")}
                  onClick={() => onTabChange(item.tab)}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon aria-hidden size={16} />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
