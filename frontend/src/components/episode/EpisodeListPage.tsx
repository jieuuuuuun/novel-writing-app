"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import WorkSearch from "@/components/work/WorkSearch";
import WorkspaceSidebar from "@/components/workspace/WorkspaceSidebar";
import {
  defaultLocale,
  getMessages,
  type Locale,
} from "@/i18n/messages";
import {
  deleteEpisode,
  getEpisodesByWork,
} from "@/lib/episode-api";
import { getWork, getWorks } from "@/lib/work-api";
import type { Episode } from "@/types/episode";
import type { Work } from "@/types/work";
import EpisodeList from "./EpisodeList";
import styles from "@/app/works/[workId]/episodes/episodes.module.css";
import workspaceStyles from "@/app/works/[workId]/workspace.module.css";

interface EpisodeListPageProps {
  workId: string;
}

function formatWorkDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function EpisodeListPage({ workId }: EpisodeListPageProps) {
  const locale = defaultLocale;
  const copy = getMessages(locale);
  const numericWorkId = Number(workId);
  const isValidWorkId = Number.isInteger(numericWorkId) && numericWorkId > 0;

  // 작품 정보, 해당 작품의 회차, 상단 검색용 작품 목록을 함께 관리합니다.
  const [work, setWork] = useState<Work | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [allWorks, setAllWorks] = useState<Work[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  // 페이지 조회 상태와 모바일 메뉴 표시 여부를 제어합니다.
  const [isLoading, setIsLoading] = useState(isValidWorkId);
  const [loadError, setLoadError] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 조회 오류 후 세 데이터를 같은 조건으로 다시 불러옵니다.
  const loadPage = async () => {
    if (!isValidWorkId) return;

    try {
      const [workData, episodeData, workListData] = await Promise.all([
        getWork(numericWorkId),
        getEpisodesByWork(numericWorkId),
        getWorks().catch(() => []),
      ]);
      setWork(workData);
      setEpisodes(episodeData);
      setAllWorks(workListData);
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // 페이지 진입 시 작품, 회차, 검색용 작품 목록을 동시에 조회합니다.
  useEffect(() => {
    if (!isValidWorkId) return;

    const controller = new AbortController();

    Promise.all([
      getWork(numericWorkId, controller.signal),
      getEpisodesByWork(numericWorkId, controller.signal),
      getWorks(controller.signal).catch(() => []),
    ])
      .then(([workData, episodeData, workListData]) => {
        setWork(workData);
        setEpisodes(episodeData);
        setAllWorks(workListData);
        setLoadError(false);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setLoadError(true);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    // 다른 화면으로 이동하면 완료되지 않은 요청을 취소합니다.
    return () => controller.abort();
  }, [isValidWorkId, numericWorkId]);

  const statusMessage = loadError
    ? copy.workspace.states.error
    : copy.workspace.states.notFound;

  // 삭제가 완료된 회차는 API 재조회 없이 현재 목록에서 바로 제거합니다.
  const handleDelete = async (episodeId: number) => {
    await deleteEpisode(episodeId);
    setEpisodes((current) =>
      current.filter((episode) => episode.id !== episodeId),
    );
  };

  return (
    <div className={workspaceStyles.workspaceShell}>
      <WorkspaceSidebar
        copy={copy.workspace}
        brand={copy.brand}
        workId={numericWorkId}
        activeMenu="episodes"
      />

      <div className={workspaceStyles.workspaceBody}>
        <header className={workspaceStyles.workspaceTopbar}>
          <button
            className={workspaceStyles.mobileMenuButton}
            type="button"
            aria-expanded={isMenuOpen}
            aria-label={copy.workspace.openMenu}
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            <span />
            <span />
            <span />
          </button>

          <Link href="/" className={workspaceStyles.mobileBrand}>
            {copy.brand.name}
            <i aria-hidden="true" />
          </Link>

          <WorkSearch
            works={allWorks}
            locale={locale}
            value={searchQuery}
            placeholder={copy.header.searchPlaceholder}
            noResults={copy.dashboard.noResultsTitle}
            onChange={setSearchQuery}
            showResults
            currentWorkId={numericWorkId}
          />

          <div className={workspaceStyles.topbarActions}>
            <button
              type="button"
              aria-label={copy.header.notifications}
              disabled
            >
              ♢
              <i />
            </button>
            <span aria-label={copy.header.profile}>WR</span>
          </div>
        </header>

        {isMenuOpen ? (
          <div
            className={workspaceStyles.mobileMenuBackdrop}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setIsMenuOpen(false);
              }
            }}
          >
            <WorkspaceSidebar
              copy={copy.workspace}
              brand={copy.brand}
              workId={numericWorkId}
              activeMenu="episodes"
              isMobile
              onClose={() => setIsMenuOpen(false)}
            />
          </div>
        ) : null}

        {isLoading ? (
          <main className={workspaceStyles.workspaceStatus} aria-live="polite">
            <span />
            <p>{copy.workspace.states.loading}</p>
          </main>
        ) : loadError || !work ? (
          <main className={workspaceStyles.workspaceStatus}>
            <strong>!</strong>
            <h1>{statusMessage}</h1>
            {loadError ? (
              <button
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  setLoadError(false);
                  void loadPage();
                }}
              >
                {copy.workspace.states.retry}
              </button>
            ) : null}
            <Link href="/">{copy.workspace.backToWorks}</Link>
          </main>
        ) : (
          <main className={styles.episodesPage}>
            <header className={styles.workHeader}>
              <div>
                <Link href={`/works/${work.id}`}>
                  <span aria-hidden="true">←</span>
                  {copy.workspace.episodeList.backToHome}
                </Link>
                <h1>{work.title}</h1>
                <p>{work.subtitle || copy.workspace.noSubtitle}</p>
                <dl>
                  <div>
                    <dt>{copy.workspace.updatedAt}</dt>
                    <dd>
                      <time dateTime={work.updatedAt}>
                        {formatWorkDate(work.updatedAt, locale)}
                      </time>
                    </dd>
                  </div>
                </dl>
              </div>
              <Link
                className={styles.newEpisodeButton}
                href={`/works/${work.id}/episodes/new`}
              >
                <span aria-hidden="true">＋</span>
                {copy.workspace.episodeList.newEpisode}
              </Link>
            </header>

            <section className={styles.listSection}>
              <header className={styles.listToolbar}>
                <div>
                  <h2>{copy.workspace.episodeList.title}</h2>
                  <span>
                    {copy.workspace.episodeList.totalCount(episodes.length)}
                  </span>
                </div>
                <div className={styles.filters}>
                  <button type="button" className={styles.activeFilter}>
                    {copy.workspace.episodeList.all(episodes.length)}
                  </button>
                  <button
                    type="button"
                    disabled
                    title={copy.workspace.episodeList.preparing}
                  >
                    {copy.workspace.episodeList.drafting}
                  </button>
                  <button
                    type="button"
                    disabled
                    title={copy.workspace.episodeList.preparing}
                  >
                    {copy.workspace.episodeList.completed}
                  </button>
                  <span className={styles.sortLabel}>
                    <i aria-hidden="true">⇅</i>
                    {copy.workspace.episodeList.latestUpdated}
                  </span>
                </div>
              </header>

              <EpisodeList
                episodes={episodes}
                workId={work.id}
                locale={locale}
                copy={copy.workspace}
                onDelete={handleDelete}
              />
            </section>
          </main>
        )}
      </div>
    </div>
  );
}
