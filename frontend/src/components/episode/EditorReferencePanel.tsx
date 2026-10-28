"use client";

import type { Messages } from "@/i18n/messages";
import ReferenceCharacters from "./ReferenceCharacters";
import styles from "@/app/works/[workId]/episodes/editor.module.css";

interface EditorReferencePanelProps {
  copy: Messages["workspace"]["episodeEditor"];
  fieldCopy: Messages["workspace"]["characterSheet"];
  workId: number;
  isOpen: boolean;
  onToggle: () => void;
}

const availableReferences = new Set(["characters"]);

export default function EditorReferencePanel({
  copy,
  fieldCopy,
  workId,
  isOpen,
  onToggle,
}: EditorReferencePanelProps) {
  const references = Object.entries(copy.references) as Array<
    [keyof typeof copy.references, string]
  >;

  return (
    <aside
      className={`${styles.referencePanel} ${
        isOpen ? styles.referenceOpen : styles.referenceClosed
      }`}
    >
      <header>
        {isOpen ? <h2>{copy.referenceTitle}</h2> : null}
        <button
          type="button"
          aria-expanded={isOpen}
          aria-label={isOpen ? copy.closeReference : copy.openReference}
          onClick={onToggle}
        >
          {isOpen ? "›" : "‹"}
        </button>
      </header>

      <div
        className={
          isOpen ? styles.referenceContent : styles.referenceContentHidden
        }
      >
        <nav aria-label={copy.referenceTitle}>
          {references.map(([key, label]) => {
            const isAvailable = availableReferences.has(key);
            const isActive = key === "characters";

            return isAvailable ? (
              <button
                className={
                  isActive ? styles.referenceTabActive : styles.referenceTab
                }
                type="button"
                aria-current={isActive ? "page" : undefined}
                key={key}
              >
                {label}
              </button>
            ) : (
              <button
                className={styles.referenceTab}
                type="button"
                disabled
                title={copy.preparing}
                key={key}
              >
                {label}
              </button>
            );
          })}
        </nav>
        <div className={styles.referenceBody}>
          <ReferenceCharacters
            key={workId}
            workId={workId}
            copy={copy.referenceCharacters}
            fieldCopy={fieldCopy}
          />
        </div>
      </div>
    </aside>
  );
}
