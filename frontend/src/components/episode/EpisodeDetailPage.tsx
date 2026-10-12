"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  defaultLocale,
  getMessages,
  type Locale,
} from "@/i18n/messages";
import { getEpisode } from "@/lib/episode-api";
import { getWork } from "@/lib/work-api";
import type { Episode } from "@/types/episode";
import type { Work } from "@/types/work";
import styles from "@/app/works/[workId]/episodes/[episodeId]/detail.module.css";

interface EpisodeDetailPageProps {
  workId: string;
  episodeId: string;
}

function formatDetailDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function EpisodeDetailPage({
  workId,
  episodeId,
}: EpisodeDetailPageProps) {
  const locale = defaultLocale;
  const copy = getMessages(locale);
  const numericWorkId = Number(workId);
  const numericEpisodeId = Number(episodeId);
  const isValidRoute =
    Number.isInteger(numericWorkId) &&
    numericWorkId > 0 &&
    Number.isInteger(numericEpisodeId) &&
    numericEpisodeId > 0;

  // 읽기 화면에 표시할 작품과 회차 데이터를 함께 관리합니다.
  const [work, setWork] = useState<Work | null>(null);
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [isLoading, setIsLoading] = useState(isValidRoute);
  const [loadError, setLoadError] = useState(false);

  // 작품과 회차를 동시에 조회하고 URL의 작품에 속한 회차인지 확인합니다.
  useEffect(() => {
    if (!isValidRoute) return;

    const controller = new AbortController();

    Promise.all([
      getWork(numericWorkId, controller.signal),
      getEpisode(numericEpisodeId, controller.signal),
    ])
      .then(([workData, episodeData]) => {
        setWork(workData);
        setEpisode(
          episodeData?.workId === numericWorkId ? episodeData : null,
        );
        setLoadError(false);
      })
      .catch((error: unknown) => {
        if (
          !(
            error instanceof DOMException &&
            error.name === "AbortError"
          )
        ) {
          setLoadError(true);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [isValidRoute, numericEpisodeId, numericWorkId]);

  const characterCount = episode
    ? new Intl.NumberFormat(locale).format(episode.content.length)
    : "0";

  if (isLoading) {
    return (
      <main className={styles.detailStatus} aria-live="polite">
        <span />
        <p>{copy.workspace.states.loading}</p>
      </main>
    );
  }

  if (loadError || !work || !episode) {
    return (
      <main className={styles.detailStatus}>
        <strong>!</strong>
        <h1>
          {loadError
            ? copy.workspace.states.error
            : copy.workspace.episodeEditor.episodeNotFound}
        </h1>
        <Link href={`/works/${numericWorkId}/episodes`}>
          {copy.workspace.episodeEditor.backToEpisodes}
        </Link>
      </main>
    );
  }

  return (
    <div className={styles.detailShell}>
      <header className={styles.detailHeader}>
        <div>
          <Link href={`/works/${work.id}/episodes`}>
            <span aria-hidden="true">←</span>
            {copy.workspace.episodeEditor.backToEpisodes}
          </Link>
          <strong>{work.title}</strong>
        </div>
        <Link
          className={styles.editButton}
          href={`/works/${work.id}/episodes/${episode.id}/edit`}
        >
          {copy.workspace.episodeDetail.edit}
        </Link>
      </header>

      <main className={styles.detailMain}>
        <article>
          <header>
            <span>
              {copy.workspace.episodeEditor.episodeNumber(
                episode.sortOrder,
              )}
            </span>
            <h1>{episode.title}</h1>
            <div className={styles.detailMeta}>
              <span>
                <strong>{copy.workspace.updatedAt}</strong>
                <time dateTime={episode.updatedAt}>
                  {formatDetailDate(episode.updatedAt, locale)}
                </time>
              </span>
              <span>
                {copy.workspace.episodeList.characterCount(
                  characterCount,
                )}
              </span>
            </div>
          </header>

          <div className={styles.episodeContent}>
            {episode.content || copy.workspace.episodeDetail.emptyContent}
          </div>
        </article>
      </main>
    </div>
  );
}
