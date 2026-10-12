"use client";

import Link from "next/link";
import { useState } from "react";
import type { Locale, Messages } from "@/i18n/messages";
import type { Episode } from "@/types/episode";
import styles from "@/app/works/[workId]/episodes/episodes.module.css";

interface EpisodeListItemProps {
  episode: Episode;
  locale: Locale;
  copy: Messages["workspace"];
  onDelete: (episodeId: number) => Promise<void>;
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

export default function EpisodeListItem({
  episode,
  locale,
  copy,
  onDelete,
}: EpisodeListItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const preview = episode.content.replace(/\s+/g, " ").trim();
  const characterCount = new Intl.NumberFormat(locale).format(
    episode.content.length,
  );

  // 삭제 확인 후 상위 목록에 완료 사실을 전달해 해당 row를 제거합니다.
  const handleDelete = async () => {
    if (!window.confirm(copy.episodeList.deleteConfirm)) return;

    setIsDeleting(true);
    try {
      await onDelete(episode.id);
    } catch {
      window.alert(copy.episodeList.deleteError);
      setIsDeleting(false);
    }
  };

  return (
    <li>
      <div className={styles.episodeRow}>
        <Link
          className={styles.episodeMainLink}
          href={`/works/${episode.workId}/episodes/${episode.id}`}
        >
          <strong className={styles.episodeNumber}>
            {copy.episodes.episodeNumber(episode.sortOrder)}
          </strong>
          <div className={styles.episodeIdentity}>
            <h3>{episode.title}</h3>
            {preview ? <p>{preview}</p> : null}
          </div>
          <time dateTime={episode.updatedAt}>
            <span>{copy.updatedAt}</span>
            {formatEpisodeDate(episode.updatedAt, locale)}
          </time>
          <span className={styles.characterCount}>
            {copy.episodeList.characterCount(characterCount)}
          </span>
        </Link>

        <div className={styles.rowActions}>
          <Link
            href={`/works/${episode.workId}/episodes/${episode.id}/edit`}
          >
            {copy.episodeList.edit}
          </Link>
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => void handleDelete()}
          >
            {isDeleting
              ? copy.episodeList.deleting
              : copy.episodeList.delete}
          </button>
        </div>

        <Link
          className={styles.rowArrow}
          href={`/works/${episode.workId}/episodes/${episode.id}`}
          aria-label={episode.title}
        >
          ›
        </Link>
      </div>
    </li>
  );
}
