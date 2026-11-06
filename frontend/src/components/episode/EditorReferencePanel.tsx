"use client";

import { useState } from "react";
import type { Messages } from "@/i18n/messages";
import ReferenceCharacters from "./ReferenceCharacters";
import ReferenceRelations from "./ReferenceRelations";
import ReferenceSynopsis from "./ReferenceSynopsis";
import ReferenceWorld from "./ReferenceWorld";
import styles from "@/app/works/[workId]/episodes/editor.module.css";

interface EditorReferencePanelProps {
  copy: Messages["workspace"]["episodeEditor"];
  fieldCopy: Messages["workspace"]["characterSheet"];
  workId: number;
  isOpen: boolean;
  onToggle: () => void;
}

type ReferenceKey = keyof Messages["workspace"]["episodeEditor"]["references"];

const availableReferences = new Set<ReferenceKey>([
  "characters",
  "relationships",
  "synopsis",
  "world",
]);

export default function EditorReferencePanel({
  copy,
  fieldCopy,
  workId,
  isOpen,
  onToggle,
}: EditorReferencePanelProps) {
  const references = Object.entries(copy.references) as Array<
    [ReferenceKey, string]
  >;
  const [activeTab, setActiveTab] = useState<ReferenceKey>("characters");

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
            const isActive = key === activeTab;

            return isAvailable ? (
              <button
                className={
                  isActive ? styles.referenceTabActive : styles.referenceTab
                }
                type="button"
                aria-current={isActive ? "page" : undefined}
                key={key}
                onClick={() => setActiveTab(key)}
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
          <div
            className={
              activeTab === "characters"
                ? undefined
                : styles.referenceContentHidden
            }
          >
            <ReferenceCharacters
              key={workId}
              workId={workId}
              copy={copy.referenceCharacters}
              fieldCopy={fieldCopy}
            />
          </div>
          <div
            className={
              activeTab === "relationships"
                ? undefined
                : styles.referenceContentHidden
            }
          >
            <ReferenceRelations
              key={workId}
              workId={workId}
              copy={copy.referenceRelations}
            />
          </div>
          <div
            className={
              activeTab === "synopsis"
                ? undefined
                : styles.referenceContentHidden
            }
          >
            <ReferenceSynopsis
              key={workId}
              workId={workId}
              copy={copy.referenceSynopsis}
            />
          </div>
          <div
            className={
              activeTab === "world" ? undefined : styles.referenceContentHidden
            }
          >
            <ReferenceWorld
              key={workId}
              workId={workId}
              copy={copy.referenceWorld}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
