import type { Messages } from "@/i18n/messages";
import styles from "./landing.module.css";

interface LandingPreviewProps {
  copy: Messages;
}

// 실제 /works 사이드바와 같게 v1에서는 작품 목록과 설정만 보여 줍니다.
const v1PreviewNavKeys = ["works", "settings"] as const;
const previewNavIcons: Record<(typeof v1PreviewNavKeys)[number], string> = {
  works: "▤",
  settings: "⚙",
};

export default function LandingPreview({ copy }: LandingPreviewProps) {
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
              {v1PreviewNavKeys.map((key, index) =>
                index === 0 ? (
                  <strong key={key}>
                    <span>{previewNavIcons[key]}</span>
                    {copy.navigation[key]}
                  </strong>
                ) : (
                  <span key={key}>
                    <span>{previewNavIcons[key]}</span>
                    {copy.navigation[key]}
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
              <span className={styles.previewAvatar}>아</span>
            </div>

            <div className={styles.previewHeading}>
              <div className={styles.previewHeadingRow}>
                <div className={styles.previewTitleBlock}>
                  <span className={styles.previewEyebrow}>
                    {copy.dashboard.eyebrow}
                  </span>
                  <h2>{copy.dashboard.title}</h2>
                </div>
                <span className={styles.previewNew}>
                  ＋ {copy.dashboard.newWork}
                </span>
              </div>
              <p>{copy.dashboard.description}</p>
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
