"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { Locale, Messages } from "@/i18n/messages";
import type { Episode } from "@/types/episode";
import EpisodeListItem from "./EpisodeListItem";
import styles from "@/app/works/[workId]/episodes/episodes.module.css";

interface EpisodeListProps {
  episodes: Episode[];
  workId: number;
  locale: Locale;
  copy: Messages["workspace"];
  onDelete: (episodeId: number) => Promise<void>;
}

export default function EpisodeList({
  episodes,
  workId,
  locale,
  copy,
  onDelete,
}: EpisodeListProps) {
  // 회차 목록 화면에서는 최근 수정된 원고가 먼저 보이도록 정렬합니다.
  const sortedEpisodes = useMemo(
    () =>
      [...episodes].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    [episodes],
  );

  if (sortedEpisodes.length === 0) {
    return (
      <div className={styles.emptyState}>
        <span aria-hidden="true">□</span>
        <h2>{copy.episodeList.empty}</h2>
        <p>{copy.episodeList.emptyDescription}</p>
        <Link href={`/works/${workId}/episodes/new`}>
          <span aria-hidden="true">＋</span>
          {copy.episodeList.newEpisode}
        </Link>
      </div>
    );
  }

  return (
    <ol className={styles.episodeList}>
      {sortedEpisodes.map((episode) => (
        <EpisodeListItem
          episode={episode}
          locale={locale}
          copy={copy}
          onDelete={onDelete}
          key={episode.id}
        />
      ))}
    </ol>
  );
}
