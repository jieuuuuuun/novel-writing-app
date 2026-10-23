"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import UserMenu from "@/components/auth/UserMenu";
import WorkSearch from "@/components/work/WorkSearch";
import {
  defaultLocale,
  getMessages,
  type Locale,
} from "@/i18n/messages";
import {
  getEpisode,
  getEpisodesByWork,
  patchEpisode,
  postEpisode,
} from "@/lib/episode-api";
import { getWork, getWorks } from "@/lib/work-api";
import type { Episode } from "@/types/episode";
import type { Work } from "@/types/work";
import EditorReferencePanel from "./EditorReferencePanel";
import styles from "@/app/works/[workId]/episodes/editor.module.css";

interface EpisodeEditorPageProps {
  workId: string;
  mode?: "create" | "edit";
  episodeId?: string;
}

interface LoadedEditorData {
  work: Work | null;
  episode: Episode | null;
  episodes: Episode[];
  allWorks: Work[];
}

function formatSavedDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getNextSortOrder(episodes: Episode[]) {
  return (
    episodes.reduce(
      (highest, episode) => Math.max(highest, episode.sortOrder),
      0,
    ) + 1
  );
}

// state 변경과 분리한 순수 데이터 요청 함수로 초기 로딩과 재시도에서 함께 사용합니다.
async function fetchEditorData(
  workId: number,
  mode: "create" | "edit",
  episodeId: number,
  signal?: AbortSignal,
): Promise<LoadedEditorData> {
  const episodeRequest =
    mode === "edit"
      ? getEpisode(episodeId, signal)
      : Promise.resolve(null);
  const [work, episodeData, episodes, allWorks] = await Promise.all([
    getWork(workId, signal),
    episodeRequest,
    getEpisodesByWork(workId, signal),
    getWorks(signal).catch(() => []),
  ]);

  const loadedEpisode = episodeData as Episode | null;

  return {
    work,
    episode:
      mode === "edit" && loadedEpisode?.workId === workId
        ? loadedEpisode
        : null,
    episodes,
    allWorks,
  };
}

export default function EpisodeEditorPage({
  workId,
  mode = "create",
  episodeId,
}: EpisodeEditorPageProps) {
  const locale = defaultLocale;
  const copy = getMessages(locale);
  const numericWorkId = Number(workId);
  const numericEpisodeId = Number(episodeId);
  const isValidWorkId =
    Number.isInteger(numericWorkId) && numericWorkId > 0;
  const isValidEpisodeId =
    mode === "create" ||
    (Number.isInteger(numericEpisodeId) && numericEpisodeId > 0);
  const isValidRoute = isValidWorkId && isValidEpisodeId;

  // 작성 모드에 필요한 작품·회차 데이터와 상단 검색용 목록을 관리합니다.
  const [work, setWork] = useState<Work | null>(null);
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [allWorks, setAllWorks] = useState<Work[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  // 사용자가 작성하는 제목, 본문, 회차 번호를 저장 요청 전까지 보관합니다.
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sortOrderInput, setSortOrderInput] = useState("");
  const [createdEpisode, setCreatedEpisode] =
    useState<Episode | null>(null);
  const [isReferenceOpen, setIsReferenceOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(isValidRoute);
  const [loadError, setLoadError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const selectedSortOrder = Number(sortOrderInput);
  const isValidSortOrder =
    Number.isInteger(selectedSortOrder) && selectedSortOrder >= 1;
  const hasDuplicateSortOrder =
    isValidSortOrder &&
    episodes.some(
      (item) =>
        item.sortOrder === selectedSortOrder &&
        (mode === "create" || item.id !== episode?.id),
    );
  const sortOrderError = !isValidSortOrder
    ? copy.workspace.episodeEditor.invalidEpisodeNumber
    : hasDuplicateSortOrder
      ? copy.workspace.episodeEditor.duplicateEpisodeNumber
      : "";

  // 수정 화면은 서버에서 받은 원고와 현재 입력값을 비교해 변경 여부를 판단합니다.
  const isDirty =
    mode === "edit" &&
    episode !== null &&
    (title !== episode.title ||
      content !== episode.content ||
      selectedSortOrder !== episode.sortOrder);
  const formattedCharacterCount = new Intl.NumberFormat(locale).format(
    content.length,
  );

  // 에디터 진입 시 작품, 회차, 검색 목록을 동시에 불러오고 이탈 시 취소합니다.
  useEffect(() => {
    if (!isValidRoute) return;

    const controller = new AbortController();

    void fetchEditorData(
      numericWorkId,
      mode,
      numericEpisodeId,
      controller.signal,
    )
      .then((data) => {
        setWork(data.work);
        setEpisode(data.episode);
        setEpisodes(data.episodes);
        setAllWorks(data.allWorks);
        if (data.episode) {
          setTitle(data.episode.title);
          setContent(data.episode.content);
          setSortOrderInput(String(data.episode.sortOrder));
        } else {
          setSortOrderInput(String(getNextSortOrder(data.episodes)));
        }
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
  }, [
    isValidRoute,
    mode,
    numericEpisodeId,
    numericWorkId,
  ]);

  // 오류 화면에서 동일한 데이터를 다시 요청합니다.
  const handleRetry = async () => {
    if (!isValidRoute) return;

    setIsLoading(true);
    setLoadError(false);

    try {
      const data = await fetchEditorData(
        numericWorkId,
        mode,
        numericEpisodeId,
      );
      setWork(data.work);
      setEpisode(data.episode);
      setEpisodes(data.episodes);
      setAllWorks(data.allWorks);
      if (data.episode) {
        setTitle(data.episode.title);
        setContent(data.episode.content);
        setSortOrderInput(String(data.episode.sortOrder));
      } else {
        setSortOrderInput(String(getNextSortOrder(data.episodes)));
      }
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // 작성 모드에 맞춰 새 회차는 POST, 기존 회차는 PATCH로 저장합니다.
  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle || !isValidRoute) {
      setSaveError(copy.workspace.episodeEditor.titleRequired);
      return;
    }

    if (sortOrderError) return;

    setSaveError("");
    setIsSaving(true);

    try {
      if (mode === "edit") {
        const updatedEpisode = await patchEpisode(numericEpisodeId, {
          title: trimmedTitle,
          content,
          sortOrder: selectedSortOrder,
        });
        setEpisode(updatedEpisode);
        setTitle(updatedEpisode.title);
        setContent(updatedEpisode.content);
        setIsSaving(false);
        return;
      }

      const savedEpisode = await postEpisode({
        workId: numericWorkId,
        title: trimmedTitle,
        content,
        sortOrder: selectedSortOrder,
      });
      setCreatedEpisode(savedEpisode);
      setIsSaving(false);
    } catch {
      setSaveError(copy.workspace.episodeEditor.saveError);
      setIsSaving(false);
    }
  };

  const statusMessage = loadError
    ? copy.workspace.states.error
    : mode === "edit"
      ? copy.workspace.episodeEditor.episodeNotFound
      : copy.workspace.states.notFound;
  const saveStatus = isSaving
    ? copy.workspace.episodeEditor.saving
    : createdEpisode
      ? copy.workspace.episodeEditor.saved
    : mode === "edit" && episode && !isDirty
      ? `${copy.workspace.episodeEditor.saved} · ${copy.workspace.episodeEditor.lastSaved(
          formatSavedDate(episode.updatedAt, locale),
        )}`
      : copy.workspace.episodeEditor.unsaved;
  const hasEditorData =
    work !== null && (mode === "create" || episode !== null);

  return (
    <div className={styles.editorShell}>
      <header className={styles.editorHeader}>
        <div className={styles.editorBreadcrumb}>
          <Link href={`/works/${numericWorkId}/episodes`}>
            <span aria-hidden="true">←</span>
            {copy.workspace.episodeEditor.backToEpisodes}
          </Link>
          {work ? <strong>{work.title}</strong> : null}
        </div>

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

        <div className={styles.saveActions}>
          <span>{saveStatus}</span>
          <button
            type="submit"
            form="episode-editor-form"
            disabled={
              isLoading ||
              isSaving ||
              createdEpisode !== null ||
              !title.trim() ||
              Boolean(sortOrderError) ||
              (mode === "edit" && !isDirty)
            }
          >
            {isSaving
              ? copy.workspace.episodeEditor.saving
              : copy.workspace.episodeEditor.save}
          </button>
          <UserMenu />
        </div>
      </header>

      {isLoading ? (
        <main className={styles.editorStatus} aria-live="polite">
          <span />
          <p>{copy.workspace.states.loading}</p>
        </main>
      ) : loadError || !hasEditorData ? (
        <main className={styles.editorStatus}>
          <strong>!</strong>
          <h1>{statusMessage}</h1>
          {loadError ? (
            <button
              type="button"
              onClick={() => void handleRetry()}
            >
              {copy.workspace.states.retry}
            </button>
          ) : null}
          <Link href="/works">{copy.workspace.backToWorks}</Link>
        </main>
      ) : (
        <main
          className={`${styles.editorLayout} ${
            isReferenceOpen ? styles.panelOpen : styles.panelClosed
          }`}
        >
          <form
            className={styles.editorForm}
            id="episode-editor-form"
            onSubmit={handleSave}
          >
            <header>
              <span>
                {mode === "edit"
                  ? copy.workspace.episodeEditor.editEpisode
                  : copy.workspace.episodeEditor.newEpisode}
              </span>
              <label className={styles.episodeOrderField}>
                <span>
                  {copy.workspace.episodeEditor.episodeNumberLabel}
                </span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  value={sortOrderInput}
                  aria-invalid={Boolean(sortOrderError)}
                  aria-describedby={
                    sortOrderError ? "episode-order-error" : undefined
                  }
                  disabled={isSaving || createdEpisode !== null}
                  onChange={(event) => {
                    setSortOrderInput(event.target.value);
                    if (saveError) setSaveError("");
                  }}
                />
                <i>{copy.workspace.episodeEditor.episodeUnit}</i>
              </label>
            </header>
            {sortOrderError ? (
              <p
                className={styles.episodeOrderError}
                id="episode-order-error"
                role="alert"
              >
                {sortOrderError}
              </p>
            ) : null}

            <label className={styles.titleField}>
              <span>{copy.workspace.episodeEditor.titleLabel}</span>
              <input
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  if (saveError) setSaveError("");
                }}
                placeholder={copy.workspace.episodeEditor.titlePlaceholder}
                maxLength={200}
                disabled={isSaving || createdEpisode !== null}
                required
              />
              <small>{title.length}/200</small>
            </label>

            <label className={styles.contentField}>
              <span>{copy.workspace.episodeEditor.contentLabel}</span>
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder={copy.workspace.episodeEditor.contentPlaceholder}
                disabled={isSaving || createdEpisode !== null}
                spellCheck
              />
            </label>

            <footer>
              {saveError ? (
                <p role="alert">{saveError}</p>
              ) : (
                <span />
              )}
              <output>
                {copy.workspace.episodeEditor.characterCount(
                  formattedCharacterCount,
                )}
              </output>
            </footer>
          </form>

          <EditorReferencePanel
            copy={copy.workspace.episodeEditor}
            isOpen={isReferenceOpen}
            onToggle={() => setIsReferenceOpen((current) => !current)}
          />
        </main>
      )}

      {mode === "create" && createdEpisode ? (
        <div className={styles.successBackdrop}>
          <section
            className={styles.successModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="episode-save-success"
          >
            <span aria-hidden="true">✓</span>
            <h2 id="episode-save-success">
              {copy.workspace.episodeEditor.savedTitle}
            </h2>
            <div>
              <Link
                href={`/works/${numericWorkId}/episodes/${createdEpisode.id}`}
              >
                {copy.workspace.episodeEditor.viewCreatedEpisode}
              </Link>
              <Link href={`/works/${numericWorkId}/episodes`}>
                {copy.workspace.episodeEditor.backToEpisodes}
              </Link>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
