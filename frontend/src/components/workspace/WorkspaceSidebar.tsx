import Link from "next/link";
import type { Messages } from "@/i18n/messages";
import styles from "@/app/works/[workId]/workspace.module.css";

interface WorkspaceSidebarProps {
  copy: Messages["workspace"];
  brand: Messages["brand"];
  workId: number;
  activeMenu?: "home" | "episodes";
  isMobile?: boolean;
  onClose?: () => void;
}

const navigationIcons = ["⌂", "▤", "♙", "⌘", "◇", "□", "▱", "⚙"];

export default function WorkspaceSidebar({
  copy,
  brand,
  workId,
  activeMenu = "home",
  isMobile = false,
  onClose,
}: WorkspaceSidebarProps) {
  const navigation = Object.entries(copy.navigation);

  return (
    <aside
      className={`${styles.workspaceSidebar} ${
        isMobile ? styles.mobileMenuPanel : ""
      }`}
    >
      <div className={styles.sidebarBrand}>
        <Link href="/" onClick={onClose}>
          <strong>
            {brand.name}
            <i aria-hidden="true" />
          </strong>
          <span>{brand.tagline}</span>
        </Link>
        {isMobile ? (
          <button
            type="button"
            aria-label={copy.closeMenu}
            onClick={onClose}
          >
            ×
          </button>
        ) : null}
      </div>

      <Link className={styles.backLink} href="/works" onClick={onClose}>
        <span aria-hidden="true">←</span>
        {copy.backToWorks}
      </Link>

      <nav aria-label={copy.navigation[activeMenu]}>
        {navigation.map(([key, item], index) => {
          const isAvailable = key === "home" || key === "episodes";
          const href =
            key === "episodes"
              ? `/works/${workId}/episodes`
              : `/works/${workId}`;

          return isAvailable ? (
            <Link
              className={
                key === activeMenu ? styles.activeNavItem : styles.navItem
              }
              href={href}
              key={item}
              onClick={onClose}
            >
              <span aria-hidden="true">{navigationIcons[index]}</span>
              {item}
            </Link>
          ) : (
            <button
              className={styles.navItem}
              type="button"
              key={item}
              disabled
              title={copy.quickLinks.preparing}
            >
              <span aria-hidden="true">{navigationIcons[index]}</span>
              {item}
            </button>
          );
        })}
      </nav>

      <blockquote>
        <span aria-hidden="true">“</span>
        {copy.quote}
      </blockquote>
    </aside>
  );
}
