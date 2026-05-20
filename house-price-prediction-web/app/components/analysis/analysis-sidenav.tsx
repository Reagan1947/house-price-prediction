"use client";

import Link from "next/link";
import { Blocks, ChartPie, CircleArrowLeft, FlaskConical, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalysisTab } from "@/lib/analysis/types";

type AnalysisSidenavProps = {
  currentTab: AnalysisTab;
  onTabChange: (tab: AnalysisTab) => void;
};

const NAV_ITEMS: Array<{ tab: AnalysisTab; label: string; icon: typeof ChartPie }> = [
  { tab: "dashboard", label: "Dashboard", icon: ChartPie },
  { tab: "segments", label: "Segments", icon: Blocks },
  { tab: "scenarios", label: "Scenarios", icon: FlaskConical },
  { tab: "data", label: "Data Table", icon: Table2 },
];

export function AnalysisSidenav({ currentTab, onTabChange }: AnalysisSidenavProps) {
  return (
    <nav className="portal-sidenav" aria-label="Analysis navigation">
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
