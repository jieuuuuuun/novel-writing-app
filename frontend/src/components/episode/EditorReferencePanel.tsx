import type { Messages } from "@/i18n/messages";
import styles from "@/app/works/[workId]/episodes/editor.module.css";

interface EditorReferencePanelProps {
  copy: Messages["workspace"]["episodeEditor"];
  isOpen: boolean;
  onToggle: () => void;
}

export default function EditorReferencePanel({
  copy,
  isOpen,
  onToggle,
}: EditorReferencePanelProps) {
  const references = Object.values(copy.references);

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

      {isOpen ? (
        <div className={styles.referenceContent}>
          <nav aria-label={copy.referenceTitle}>
            {references.map((reference) => (
              <button
                type="button"
                disabled
                title={copy.preparing}
                key={reference}
              >
                {reference}
              </button>
            ))}
          </nav>
          <div>
            <span aria-hidden="true">◇</span>
            <p>{copy.preparing}</p>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
