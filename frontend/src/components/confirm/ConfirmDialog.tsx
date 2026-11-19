"use client";

import styles from "./confirm-dialog.module.css";

interface ConfirmDialogProps {
  titleId: string;
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  confirmBusyLabel?: string;
  isBusy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDialog({
  titleId,
  title,
  description,
  cancelLabel,
  confirmLabel,
  confirmBusyLabel,
  isBusy = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <div
      className={styles.confirmOverlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isBusy) {
          onCancel();
        }
      }}
    >
      <section
        className={styles.confirmCard}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <h2 id={titleId}>{title}</h2>
        <p>{description}</p>
        <div className={styles.confirmActions}>
          <button
            className={styles.ghostButton}
            type="button"
            disabled={isBusy}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            className={styles.dangerButton}
            type="button"
            disabled={isBusy}
            onClick={onConfirm}
          >
            {isBusy ? (confirmBusyLabel ?? confirmLabel) : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
