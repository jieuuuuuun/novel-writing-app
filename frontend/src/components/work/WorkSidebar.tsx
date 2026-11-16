import Link from "next/link";
import type { Messages } from "@/i18n/messages";
import styles from "@/app/page.module.css";

interface WorkSidebarProps {
  brand: Messages["brand"];
  navigation: Messages["navigation"];
  quote: string;
  closeLabel: string;
  activeMenu?: "works" | "settings";
  isMobile?: boolean;
  onClose?: () => void;
}

const navigationIcons: Record<keyof Messages["navigation"], string> = {
  works: "▤",
  statistics: "⌁",
  library: "□",
  world: "◎",
  settings: "⚙",
};

// v1에서는 작품 목록과 설정만 노출합니다. v1.1에서 statistics/library/world를 다시 넣으면 됩니다.
const v1NavigationKeys = ["works", "settings"] as const;

const hrefByKey: Record<"works" | "settings", string> = {
  works: "/works",
  settings: "/settings",
};

export default function WorkSidebar({
  brand,
  navigation,
  quote,
  closeLabel,
  activeMenu = "works",
  isMobile = false,
  onClose,
}: WorkSidebarProps) {
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
        {v1NavigationKeys.map((key) => (
          <Link
            className={
              key === activeMenu ? styles.activeNavItem : styles.navItem
            }
            href={hrefByKey[key]}
            key={key}
            onClick={onClose}
          >
            <span aria-hidden="true">{navigationIcons[key]}</span>
            <span>{navigation[key]}</span>
          </Link>
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
