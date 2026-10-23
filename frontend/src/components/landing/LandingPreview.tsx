import type { Messages } from "@/i18n/messages";
import styles from "./landing.module.css";

interface LandingPreviewProps {
  copy: Messages;
}

export default function LandingPreview({ copy }: LandingPreviewProps) {
  const navItems = Object.values(copy.navigation);

  return (
    <section
      className={styles.previewWrap}
      aria-label={copy.landing.previewLabel}
    >
      <div className={styles.previewFrame}>
        <div className={styles.previewShell} aria-hidden="true">
          <aside className={styles.previewSidebar}>
            <div className={styles.previewBrand}>
              {copy.brand.name}
              <span className={styles.leafMark} />
            </div>
            <div className={styles.previewNav}>
              {navItems.map((item, index) =>
                index === 0 ? (
                  <strong key={item}>
                    <span>▤</span>
                    {item}
                  </strong>
                ) : (
                  <span key={item}>
                    <span>{["⌁", "□", "◎", "⚙"][index - 1]}</span>
                    {item}
                  </span>
                ),
              )}
            </div>
          </aside>

          <div className={styles.previewMain}>
            <div className={styles.previewTopbar}>
              <div className={styles.previewSearch}>
                {copy.header.searchPlaceholder}
              </div>
              <span className={styles.previewBell}>♢</span>
              <span className={styles.previewAvatar}>글</span>
            </div>

            <div className={styles.previewHeading}>
              <div>
                <span className={styles.previewEyebrow}>
                  {copy.dashboard.eyebrow}
                </span>
                <h2>{copy.dashboard.title}</h2>
                <p>{copy.dashboard.description}</p>
              </div>
              <span className={styles.previewNew}>
                ＋ {copy.dashboard.newWork}
              </span>
            </div>

            <div className={styles.previewRecent}>
              <div className={styles.previewRecentContent}>
                <span>{copy.dashboard.recentLabel}</span>
                <h3>{copy.dashboard.recentEmptyTitle}</h3>
                <p>{copy.dashboard.recentEmptyDescription}</p>
                <i>{copy.dashboard.newWork}</i>
              </div>
              <div className={styles.previewPaper} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
