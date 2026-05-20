"use client";

import { ChevronDown, Download } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { PdfExportScope } from "@/lib/analysis/exporters/pdf";

type AnalysisExportMenuProps = {
  disabled: boolean;
  busy: boolean;
  onExportCsv: () => void;
  onExportPdf: (scope: PdfExportScope) => void;
};

export function AnalysisExportMenu({ disabled, busy, onExportCsv, onExportPdf }: AnalysisExportMenuProps) {
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!triggerRef.current?.parentElement?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handlePdf = () => {
    const scope = window.prompt(
      "Export PDF for: dashboard, table, or selected?",
      "dashboard",
    ) as PdfExportScope | null;

    if (scope === "dashboard" || scope === "table" || scope === "selected") {
      onExportPdf(scope);
    }

    setOpen(false);
  };

  return (
    <div className="analysis-export-menu">
      <button
        ref={triggerRef}
        type="button"
        className="valuation-btn valuation-btn-primary analysis-export-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        disabled={disabled || busy}
        title={disabled ? "Nothing to export." : undefined}
        onClick={() => setOpen((current) => !current)}
      >
        <Download aria-hidden size={14} />
        Export
        <ChevronDown aria-hidden size={14} />
      </button>

      {open ? (
        <ul id={menuId} className="analysis-export-dropdown" role="menu">
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className="analysis-export-item"
              onClick={() => {
                onExportCsv();
                setOpen(false);
              }}
            >
              Export as CSV
            </button>
          </li>
          <li role="none">
            <button type="button" role="menuitem" className="analysis-export-item" onClick={handlePdf}>
              Export as PDF
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
