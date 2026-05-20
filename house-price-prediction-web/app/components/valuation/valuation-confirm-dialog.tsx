"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

type ValuationConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ValuationConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ValuationConfirmDialogProps) {
  const titleId = useId();
  const messageId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      cancelButtonRef.current?.focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onCancel, open]);

  const portalRoot = typeof document === "undefined" ? null : document.body;

  if (!portalRoot || !open) {
    return null;
  }

  return createPortal(
    <div className="valuation-confirm-overlay" role="presentation" onMouseDown={onCancel}>
      <div
        className="valuation-confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h3 id={titleId} className="valuation-confirm-title">
          {title}
        </h3>
        <p id={messageId} className="valuation-confirm-message">
          {message}
        </p>
        <div className="valuation-confirm-footer">
          <button
            ref={cancelButtonRef}
            type="button"
            className="valuation-btn valuation-btn-secondary"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button type="button" className="valuation-btn valuation-btn-primary" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    portalRoot,
  );
}
