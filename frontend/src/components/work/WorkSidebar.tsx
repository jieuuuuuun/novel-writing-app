import type { Messages } from "@/i18n/messages";
import styles from "@/app/page.module.css";

interface WorkSidebarProps {
  brand: Messages["brand"];
  navigation: Messages["navigation"];
  quote: string;
  closeLabel: string;
  isMobile?: boolean;
  onClose?: () => void;
}

const navigationIcons = ["▤", "⌁", "□", "◎", "⚙"];

export default function WorkSidebar({
  brand,
  navigation,
  quote,
  closeLabel,
  isMobile = false,
  onClose,
}: WorkSidebarProps) {
  const items = Object.values(navigation);

  return (
    <aside
      className={`${styles.sidebar} ${
        isMobile ? styles.mobileSidebarPanel : ""
      }`}
    >
      <div className={styles.brand}>
        <div className={styles.brandRow}>
          <div className={styles.brandName}>
            {brand.name}
            <span className={styles.leafMark} aria-hidden="true" />
          </div>
          {isMobile ? (
            <button
              className={styles.sidebarCloseButton}
              type="button"
              aria-label={closeLabel}
              onClick={onClose}
            >
              ×
            </button>
          ) : null}
        </div>
        <p>{brand.tagline}</p>
      </div>

      <nav className={styles.sidebarNav} aria-label={navigation.works}>
        {items.map((item, index) => (
          <button
            className={
              index === 0 ? styles.activeNavItem : styles.navItem
            }
            type="button"
            key={item}
            onClick={isMobile ? onClose : undefined}
          >
            <span aria-hidden="true">{navigationIcons[index]}</span>
            <span>{item}</span>
          </button>
        ))}
      </nav>

      <div className={styles.sidebarNote}>
        <span aria-hidden="true">“</span>
        <p>{quote}</p>
      </div>
      <div className={styles.sidebarDecoration} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </aside>
  );
}
