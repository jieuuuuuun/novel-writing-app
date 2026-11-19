import Link from "next/link";
import type { Messages } from "@/i18n/messages";
import styles from "@/app/works/[workId]/workspace.module.css";

interface WorkspaceSidebarProps {
  copy: Messages["workspace"];
  brand: Messages["brand"];
  workId: number;
  activeMenu?:
    | "home"
    | "planning"
    | "characters"
    | "relationships"
    | "world"
    | "synopsis"
    | "episodes";
  isMobile?: boolean;
  onClose?: () => void;
}

const navigationIcons = ["⌂", "▤", "♙", "⌘", "◇", "□", "▱", "⚙"];

// v1에서는 작품별 설정을 노출하지 않습니다. v1.1에서 settings를 다시 넣으면 됩니다.
const v1NavigationKeys = new Set([
  "home",
  "planning",
  "characters",
  "relationships",
  "world",
  "synopsis",
  "episodes",
]);

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
          if (!v1NavigationKeys.has(key)) {
            return null;
          }

          const href =
            key === "planning"
              ? `/works/${workId}/planning`
              : key === "characters"
                ? `/works/${workId}/characters`
                : key === "relationships"
                  ? `/works/${workId}/relations`
                  : key === "world"
                    ? `/works/${workId}/world`
                    : key === "synopsis"
                      ? `/works/${workId}/synopsis`
                      : key === "episodes"
                        ? `/works/${workId}/episodes`
                        : `/works/${workId}`;

          return (
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
