"use client";

import { useMemo } from "react";
import type { Locale, Messages } from "@/i18n/messages";
import type { Episode } from "@/types/episode";
import styles from "@/app/works/[workId]/workspace.module.css";

interface RecentEpisodesProps {
  copy: Messages["workspace"];
  episodes: Episode[];
  locale: Locale;
}

function formatEpisodeDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function RecentEpisodes({
  copy,
  episodes,
  locale,
}: RecentEpisodesProps) {
  // 집필 순서를 우선하므로 sortOrder가 높은 회차부터 최대 4개를 표시합니다.
  const recentEpisodes = useMemo(
    () =>
      [...episodes]
        .sort((a, b) => b.sortOrder - a.sortOrder)
        .slice(0, 4),
    [episodes],
  );

  return (
    <section className={styles.recentEpisodes} id="recent-episodes">
      <header>
        <h2>
          <span aria-hidden="true">▱</span>
          {copy.episodes.title}
        </h2>
        <button
          type="button"
          disabled
          title={copy.quickLinks.preparing}
        >
          {copy.episodes.viewAll}
          <span aria-hidden="true">›</span>
        </button>
      </header>

      {recentEpisodes.length === 0 ? (
        <div className={styles.episodesEmpty}>
          <span aria-hidden="true">□</span>
          <div>
            <h3>{copy.episodes.empty}</h3>
            <p>{copy.episodes.emptyDescription}</p>
          </div>
        </div>
      ) : (
        <ol>
          {recentEpisodes.map((episode) => (
            <li key={episode.id}>
              <span>{copy.episodes.episodeNumber(episode.sortOrder)}</span>
              <div>
                <h3>{episode.title}</h3>
                <time dateTime={episode.updatedAt}>
                  {copy.updatedAt}{" "}
                  {formatEpisodeDate(episode.updatedAt, locale)}
                </time>
              </div>
              <span aria-hidden="true">›</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
