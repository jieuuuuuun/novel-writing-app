"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  defaultLocale,
  getMessages,
  type Locale,
} from "@/i18n/messages";
import { getEpisodesByWork } from "@/lib/episode-api";
import { getWork, getWorks, patchWork } from "@/lib/work-api";
import type { Episode } from "@/types/episode";
import type { UpdateWorkInput, Work } from "@/types/work";
import EditWorkModal from "@/components/work/EditWorkModal";
import WorkSearch from "@/components/work/WorkSearch";
import UserMenu from "@/components/auth/UserMenu";
import RecentEpisodes from "./RecentEpisodes";
import WorkspaceHero from "./WorkspaceHero";
import WorkspaceQuickLinks from "./WorkspaceQuickLinks";
import WorkspaceSidebar from "./WorkspaceSidebar";
import styles from "@/app/works/[workId]/workspace.module.css";

interface WorkWorkspaceProps {
  workId: string;
}

function formatWorkspaceDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function WorkWorkspace({ workId }: WorkWorkspaceProps) {
  const locale = defaultLocale;
  const copy = getMessages(locale);
  const numericWorkId = Number(workId);
  const isValidWorkId = Number.isInteger(numericWorkId) && numericWorkId > 0;

  // 현재 워크스페이스에 표시할 작품과 해당 작품의 회차를 관리합니다.
  const [work, setWork] = useState<Work | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  // 상단 검색에서 다른 작품을 찾을 수 있도록 전체 작품 목록을 함께 보관합니다.
  const [allWorks, setAllWorks] = useState<Work[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  // 최초 조회, 오류 화면, 모바일 메뉴 표시 상태를 각각 제어합니다.
  const [isLoading, setIsLoading] = useState(isValidWorkId);
  const [loadError, setLoadError] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // 오류 후 다시 시도할 때 작품과 회차를 함께 새로 불러옵니다.
  const loadWorkspace = async () => {
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

  // 동적 경로의 작품 ID가 바뀔 때 해당 작품과 회차 데이터를 조회합니다.
  useEffect(() => {
    if (!isValidWorkId) return;

    // 다른 화면으로 이동하면 완료되지 않은 두 API 요청을 함께 취소합니다.
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

    return () => controller.abort();
  }, [isValidWorkId, numericWorkId]);

  const statusMessage = loadError
    ? copy.workspace.states.error
    : copy.workspace.states.notFound;

  // 수정 응답을 작품 홈과 상단 검색 목록에 즉시 반영합니다.
  const handleUpdate = async (
    targetWorkId: number,
    input: UpdateWorkInput,
  ) => {
    const updatedWork = await patchWork(targetWorkId, input);
    setWork(updatedWork);
    setAllWorks((current) =>
      current.map((item) =>
        item.id === updatedWork.id ? updatedWork : item,
      ),
    );
  };

  return (
    <div className={styles.workspaceShell}>
      <WorkspaceSidebar
        copy={copy.workspace}
        brand={copy.brand}
        workId={numericWorkId}
      />

      <div className={styles.workspaceBody}>
        <header className={styles.workspaceTopbar}>
          <button
            className={styles.mobileMenuButton}
            type="button"
            aria-expanded={isMenuOpen}
            aria-label={copy.workspace.openMenu}
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            <span />
            <span />
            <span />
          </button>

          <Link href="/works" className={styles.mobileBrand}>
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

          <div className={styles.topbarActions}>
            <button
              type="button"
              aria-label={copy.header.notifications}
              disabled
            >
              ♢
              <i />
            </button>
            <UserMenu />
          </div>
        </header>

        {isMenuOpen ? (
          <div
            className={styles.mobileMenuBackdrop}
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
              isMobile
              onClose={() => setIsMenuOpen(false)}
            />
          </div>
        ) : null}

        {isLoading ? (
          <main className={styles.workspaceStatus} aria-live="polite">
            <span />
            <p>{copy.workspace.states.loading}</p>
          </main>
        ) : loadError || !work ? (
          <main className={styles.workspaceStatus}>
            <strong>!</strong>
            <h1>{statusMessage}</h1>
            {loadError ? (
              <button
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  setLoadError(false);
                  void loadWorkspace();
                }}
              >
                {copy.workspace.states.retry}
              </button>
            ) : null}
            <Link href="/works">{copy.workspace.backToWorks}</Link>
          </main>
        ) : (
          <main className={styles.workspaceMain}>
            <header className={styles.workHeading}>
              <div>
                <Link href="/works">{copy.workspace.backToWorks}</Link>
                <h1>{work.title}</h1>
                <div className={styles.workHeadingMeta}>
                  <p>{work.subtitle || copy.workspace.noSubtitle}</p>
                  <dl>
                    <div>
                      <dt>{copy.workspace.updatedAt}</dt>
                      <dd>
                        <time dateTime={work.updatedAt}>
                          {formatWorkspaceDate(work.updatedAt, locale)}
                        </time>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
              <button
                className={styles.editWorkButton}
                type="button"
                onClick={() => setIsEditModalOpen(true)}
              >
                <span aria-hidden="true">✎</span>
                {copy.workspace.editWork}
              </button>
            </header>

            <WorkspaceHero copy={copy.workspace} work={work} />

            <div className={styles.workspaceGrid}>
              <section className={styles.workOverview}>
                <header>
                  <h2>
                    <span aria-hidden="true">▤</span>
                    {copy.workspace.overview.title}
                  </h2>
                </header>
                <dl>
                  <div>
                    <dt>{copy.workspace.overview.workTitle}</dt>
                    <dd>{work.title}</dd>
                  </div>
                  <div>
                    <dt>{copy.workspace.overview.subtitle}</dt>
                    <dd>{work.subtitle || copy.workspace.noSubtitle}</dd>
                  </div>
                  <div>
                    <dt>{copy.workspace.createdAt}</dt>
                    <dd>
                      <time dateTime={work.createdAt}>
                        {formatWorkspaceDate(work.createdAt, locale)}
                      </time>
                    </dd>
                  </div>
                  <div>
                    <dt>{copy.workspace.updatedAt}</dt>
                    <dd>
                      <time dateTime={work.updatedAt}>
                        {formatWorkspaceDate(work.updatedAt, locale)}
                      </time>
                    </dd>
                  </div>
                </dl>
              </section>

              <WorkspaceQuickLinks
                copy={copy.workspace}
                workId={work.id}
              />
              <RecentEpisodes
                copy={copy.workspace}
                episodes={episodes}
                locale={locale}
                workId={numericWorkId}
              />
            </div>
          </main>
        )}
      </div>

      {isEditModalOpen && work ? (
        <EditWorkModal
          copy={copy.workEdit}
          work={work}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={handleUpdate}
        />
      ) : null}
    </div>
  );
}
