"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  defaultLocale,
  getMessages,
  type Locale,
} from "@/i18n/messages";
import {
  deleteWork,
  getWorks,
  patchWork,
  postWork,
} from "@/lib/work-api";
import type {
  CreateWorkInput,
  UpdateWorkInput,
  Work,
} from "@/types/work";
import EditWorkModal from "./EditWorkModal";
import NewWorkModal from "./NewWorkModal";
import WorkSearch from "./WorkSearch";
import WorkSidebar from "./WorkSidebar";
import styles from "@/app/page.module.css";

function formatDate(value: string, locale: Locale) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function WorkDashboard() {
  const locale = defaultLocale;
  const copy = getMessages(locale);
  // API에서 받아 화면에 표시할 전체 작품 목록입니다.
  const [works, setWorks] = useState<Work[]>([]);
  // 최초 조회와 재시도 중 로딩 화면을 제어합니다.
  const [isLoading, setIsLoading] = useState(true);
  // 목록 조회 실패 여부에 따라 오류 화면을 보여줍니다.
  const [loadError, setLoadError] = useState(false);
  // 새 작품 등록 모달의 열림 상태를 관리합니다.
  const [isModalOpen, setIsModalOpen] = useState(false);
  // 제목과 부제를 필터링할 현재 검색어입니다.
  const [searchQuery, setSearchQuery] = useState("");
  // 모바일에서 홈 전용 사이드바 drawer의 표시 상태를 제어합니다.
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // 수정할 작품과 삭제 진행 중인 작품을 각각 구분해 관리합니다.
  const [editingWork, setEditingWork] = useState<Work | null>(null);
  const [deletingWorkId, setDeletingWorkId] = useState<number | null>(
    null,
  );

  // 등록 후 갱신하거나 조회 실패를 재시도할 때 목록을 다시 불러옵니다.
  const refreshWorks = async () => {
    try {
      const data = await getWorks();
      setWorks(data);
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // 화면에 처음 진입했을 때 작품 목록을 한 번 불러옵니다.
  useEffect(() => {
    // 화면을 벗어난 뒤 요청 결과가 반영되지 않도록 취소 신호를 전달합니다.
    const controller = new AbortController();

    getWorks(controller.signal)
      .then((data) => {
        setWorks(data);
        setLoadError(false);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setLoadError(true);
        }
      })
      .finally(() => setIsLoading(false));

    // 컴포넌트가 사라질 때 진행 중인 요청을 취소합니다.
    return () => controller.abort();
  }, []);

  // 원본 배열을 바꾸지 않고 최근 수정된 작품이 먼저 오도록 정렬합니다.
  const sortedWorks = useMemo(
    () =>
      [...works].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    [works],
  );

  // 검색어가 있으면 현재 언어의 대소문자 규칙으로 제목과 부제를 필터링합니다.
  const visibleWorks = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase(locale);

    if (!normalizedQuery) {
      return sortedWorks;
    }

    return sortedWorks.filter(
      (work) =>
        work.title.toLocaleLowerCase(locale).includes(normalizedQuery) ||
        work.subtitle?.toLocaleLowerCase(locale).includes(normalizedQuery),
    );
  }, [locale, searchQuery, sortedWorks]);

  // 정렬된 목록의 첫 항목을 최근 작업 영역에 사용합니다.
  const recentWork = sortedWorks[0];

  // 등록 결과를 즉시 목록에 반영한 뒤 GET 요청으로 서버 데이터와 다시 맞춥니다.
  const handleCreate = async (input: CreateWorkInput) => {
    const createdWork = await postWork(input);

    setWorks((current) => [
      createdWork,
      ...current.filter((work) => work.id !== createdWork.id),
    ]);
    void refreshWorks();
  };

  // PATCH 응답으로 목록의 해당 작품을 즉시 교체합니다.
  const handleUpdate = async (
    workId: number,
    input: UpdateWorkInput,
  ) => {
    const updatedWork = await patchWork(workId, input);
    setWorks((current) =>
      current.map((work) =>
        work.id === updatedWork.id ? updatedWork : work,
      ),
    );
  };

  // cascade 삭제를 확인한 뒤 성공한 작품을 현재 목록에서 제거합니다.
  const handleDelete = async (workId: number) => {
    if (!window.confirm(copy.dashboard.deleteWorkConfirm)) return;

    setDeletingWorkId(workId);
    try {
      await deleteWork(workId);
      setWorks((current) =>
        current.filter((work) => work.id !== workId),
      );
    } catch {
      window.alert(copy.dashboard.deleteWorkError);
    } finally {
      setDeletingWorkId(null);
    }
  };

  return (
    <div className={styles.appShell}>
      <WorkSidebar
        brand={copy.brand}
        navigation={copy.navigation}
        quote={copy.workspace.quote}
        closeLabel={copy.workspace.closeMenu}
      />

      <div className={styles.workspace}>
        <header className={styles.topbar}>
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

          <div className={styles.mobileBrand}>
            <span>{copy.brand.name}</span>
            <span className={styles.leafMark} aria-hidden="true" />
          </div>
          <WorkSearch
            works={works}
            locale={locale}
            value={searchQuery}
            placeholder={copy.header.searchPlaceholder}
            noResults={copy.dashboard.noResultsTitle}
            onChange={setSearchQuery}
          />
          <div className={styles.profileArea}>
            <button
              className={styles.notificationButton}
              type="button"
              aria-label={copy.header.notifications}
            >
              <span aria-hidden="true">♢</span>
              <i />
            </button>
            <button
              className={styles.profileButton}
              type="button"
              aria-label={copy.header.profile}
            >
              <span>WR</span>
              <i aria-hidden="true" />
            </button>
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
            <WorkSidebar
              brand={copy.brand}
              navigation={copy.navigation}
              quote={copy.workspace.quote}
              closeLabel={copy.workspace.closeMenu}
              isMobile
              onClose={() => setIsMenuOpen(false)}
            />
          </div>
        ) : null}

        <main className={styles.mainContent}>
          <section className={styles.pageHeading}>
            <div>
              <span className={styles.eyebrow}>{copy.dashboard.eyebrow}</span>
              <h1>{copy.dashboard.title}</h1>
              <p>{copy.dashboard.description}</p>
            </div>
            <button
              className={styles.newWorkButton}
              type="button"
              onClick={() => setIsModalOpen(true)}
            >
              <span aria-hidden="true">＋</span>
              {copy.dashboard.newWork}
            </button>
          </section>

          <section className={styles.recentCard}>
            <div className={styles.recentGlow} aria-hidden="true" />
            <div className={styles.recentContent}>
              <span className={styles.recentLabel}>
                {copy.dashboard.recentLabel}
              </span>
              <h2>
                {recentWork
                  ? (
                      <Link href={`/works/${recentWork.id}`}>
                        {recentWork.title}
                      </Link>
                    )
                  : copy.dashboard.recentEmptyTitle}
              </h2>
              <p>
                {recentWork
                  ? recentWork.subtitle || copy.dashboard.recentTitle
                  : copy.dashboard.recentEmptyDescription}
              </p>
              {recentWork ? (
                <div className={styles.recentMeta}>
                  <span>{copy.dashboard.updatedAt}</span>
                  <time dateTime={recentWork.updatedAt}>
                    {formatDate(recentWork.updatedAt, locale)}
                  </time>
                  <Link
                    className={styles.continueWritingButton}
                    href={`/works/${recentWork.id}#recent-episodes`}
                  >
                    {copy.dashboard.continueWriting}
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              ) : (
                <button
                  className={styles.recentCreateButton}
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                >
                  {copy.dashboard.newWork}
                </button>
              )}
            </div>
            <div className={styles.paperScene} aria-hidden="true">
              <div className={styles.paper}>
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className={styles.pen} />
            </div>
          </section>

          <section className={styles.worksSection}>
            <div className={styles.sectionHeading}>
              <div>
                <h2>{copy.dashboard.allWorks}</h2>
                <span>{copy.dashboard.workCount(works.length)}</span>
              </div>
              <button
                className={styles.compactNewButton}
                type="button"
                onClick={() => setIsModalOpen(true)}
              >
                <span aria-hidden="true">＋</span>
                {copy.dashboard.newWork}
              </button>
            </div>

            {isLoading ? (
              <div className={styles.statusPanel} aria-live="polite">
                <span className={styles.loadingMark} aria-hidden="true" />
                <p>{copy.dashboard.loading}</p>
              </div>
            ) : loadError && works.length === 0 ? (
              <div className={styles.statusPanel}>
                <span className={styles.statusSymbol} aria-hidden="true">
                  !
                </span>
                <h3>{copy.dashboard.loadError}</h3>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  onClick={() => {
                    setIsLoading(true);
                    setLoadError(false);
                    void refreshWorks();
                  }}
                >
                  {copy.dashboard.retry}
                </button>
              </div>
            ) : visibleWorks.length === 0 ? (
              <div className={styles.statusPanel}>
                <span className={styles.emptyBook} aria-hidden="true">
                  ◫
                </span>
                <h3>
                  {searchQuery
                    ? copy.dashboard.noResultsTitle
                    : copy.dashboard.emptyTitle}
                </h3>
                <p>
                  {searchQuery
                    ? copy.dashboard.noResultsDescription
                    : copy.dashboard.emptyDescription}
                </p>
                {!searchQuery ? (
                  <button
                    className={styles.primaryButton}
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                  >
                    {copy.dashboard.newWork}
                  </button>
                ) : null}
              </div>
            ) : (
              <div className={styles.workList}>
                <div className={styles.listHeader} aria-hidden="true">
                  <span>{copy.modal.workTitle}</span>
                  <span>{copy.dashboard.createdAt}</span>
                  <span>{copy.dashboard.updatedAt}</span>
                  <span />
                </div>
                <ul>
                  {visibleWorks.map((work) => (
                    <li key={work.id}>
                      <div className={styles.workRow}>
                        <Link
                          className={styles.workItem}
                          href={`/works/${work.id}`}
                        >
                          <div className={styles.workIdentity}>
                            <span
                              className={styles.documentIcon}
                              aria-hidden="true"
                            >
                              <i />
                            </span>
                            <div>
                              <h3>{work.title}</h3>
                              {work.subtitle ? (
                                <p>{work.subtitle}</p>
                              ) : null}
                            </div>
                          </div>
                          <div className={styles.dateCell}>
                            <span>{copy.dashboard.createdAt}</span>
                            <time dateTime={work.createdAt}>
                              {formatDate(work.createdAt, locale)}
                            </time>
                          </div>
                          <div className={styles.dateCell}>
                            <span>{copy.dashboard.updatedAt}</span>
                            <time dateTime={work.updatedAt}>
                              {formatDate(work.updatedAt, locale)}
                            </time>
                          </div>
                        </Link>

                        <div className={styles.workActions}>
                          <button
                            type="button"
                            onClick={() => setEditingWork(work)}
                          >
                            {copy.dashboard.edit}
                          </button>
                          <button
                            type="button"
                            disabled={deletingWorkId === work.id}
                            onClick={() => void handleDelete(work.id)}
                          >
                            {deletingWorkId === work.id
                              ? copy.dashboard.deleting
                              : copy.dashboard.delete}
                          </button>
                        </div>

                        <Link
                          className={styles.workRowArrow}
                          href={`/works/${work.id}`}
                          aria-label={work.title}
                        >
                          ›
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </main>
      </div>

      {isModalOpen ? (
        <NewWorkModal
          copy={copy.modal}
          onClose={() => setIsModalOpen(false)}
          onCreate={handleCreate}
        />
      ) : null}

      {editingWork ? (
        <EditWorkModal
          copy={copy.workEdit}
          work={editingWork}
          onClose={() => setEditingWork(null)}
          onUpdate={handleUpdate}
        />
      ) : null}
    </div>
  );
}
