import Link from "next/link";
import type { Messages } from "@/i18n/messages";
import type { Work } from "@/types/work";
import styles from "@/app/works/[workId]/workspace.module.css";

interface WorkspaceHeroProps {
  copy: Messages["workspace"];
  work: Work;
}

export default function WorkspaceHero({
  copy,
  work,
}: WorkspaceHeroProps) {
  return (
    <section className={styles.workspaceHero}>
      <div>
        <span>{copy.hero.eyebrow}</span>
        <h2>{copy.hero.title}</h2>
        <p>{work.subtitle || copy.hero.description}</p>
        <div className={styles.heroActions}>
          <Link
            className={styles.newEpisodeAction}
            href={`/works/${work.id}/episodes/new`}
            title={copy.hero.preparing}
          >
            <span aria-hidden="true">✎</span>
            {copy.hero.newEpisode}
          </Link>
          <Link
            className={styles.episodeListAction}
            href={`/works/${work.id}/episodes`}
          >
            <span aria-hidden="true">▱</span>
            {copy.hero.viewEpisodes}
          </Link>
        </div>
      </div>

      <div className={styles.heroStillLife} aria-hidden="true">
        <div className={styles.heroBook} />
        <div className={styles.heroPaper}>
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className={styles.heroPen} />
        <div className={styles.heroSprig}>
          <i />
          <i />
          <i />
        </div>
      </div>
    </section>
  );
}
