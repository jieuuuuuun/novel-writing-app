"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import UserMenu from "@/components/auth/UserMenu";
import WorkSearch from "@/components/work/WorkSearch";
import WorkspaceSidebar from "@/components/workspace/WorkspaceSidebar";
import { defaultLocale, getMessages } from "@/i18n/messages";
import {
  createSynopsis,
  deleteSynopsis,
  duplicateSynopsis,
  getSynopsis,
  getSynopses,
  setCurrentSynopsis,
  updateSynopsis,
} from "@/lib/synopsis-api";
import { getWork, getWorks } from "@/lib/work-api";
import type {
  SynopsisDetail,
  SynopsisFormState,
  SynopsisListItem,
} from "@/types/synopsis";
import {
  SYNOPSIS_TITLE_MAX,
  emptySynopsisForm,
} from "@/types/synopsis";
import type { Work } from "@/types/work";
import styles from "@/app/works/[workId]/synopsis/synopsis.module.css";
import workspaceStyles from "@/app/works/[workId]/workspace.module.css";

interface WorkSynopsisPageProps {
  workId: string;
}

type BusyAction = "" | "save" | "create" | "duplicate" | "current" | "delete";
type PendingNav =
  | { type: "select"; id: number }
  | { type: "create" }
  | { type: "duplicate" };

function toFormState(detail: SynopsisDetail): SynopsisFormState {
  return {
    title: detail.title,
    summary: detail.summary,
    beginning: detail.beginning,
    development: detail.development,
    crisis: detail.crisis,
    ending: detail.ending,
    memo: detail.memo,
  };
}

function toListItem(
  detail: SynopsisDetail,
  currentId: number | null,
): SynopsisListItem {
  return {
    id: detail.id,
    title: detail.title,
    sortOrder: detail.sortOrder,
    isCurrent: currentId === detail.id,
    updatedAt: detail.updatedAt,
  };
}

function sortItems(items: SynopsisListItem[]) {
  return [...items].sort(
    (left, right) => left.sortOrder - right.sortOrder || left.id - right.id,
  );
}

function mergeItem(
  items: SynopsisListItem[],
  detail: SynopsisDetail,
  currentId: number | null,
) {
  const nextItem = toListItem(detail, currentId);
  const exists = items.some((item) => item.id === detail.id);
  const merged = exists
    ? items.map((item) => (item.id === detail.id ? nextItem : item))
    : [...items, nextItem];

  return sortItems(
    merged.map((item) => ({
      ...item,
      isCurrent: currentId === item.id,
    })),
  );
}

function isSameForm(left: SynopsisFormState, right: SynopsisFormState) {
  return (
    left.title === right.title &&
    left.summary === right.summary &&
    left.beginning === right.beginning &&
    left.development === right.development &&
    left.crisis === right.crisis &&
    left.ending === right.ending &&
    left.memo === right.memo
  );
}

export default function WorkSynopsisPage({ workId }: WorkSynopsisPageProps) {
  const locale = defaultLocale;
  const copy = getMessages(locale);
  const synopsisCopy = copy.workspace.synopsis;
  const numericWorkId = Number(workId);
  const isValidWorkId = Number.isInteger(numericWorkId) && numericWorkId > 0;
  const detailAbortRef = useRef<AbortController | null>(null);
  const currentIdRef = useRef<number | null>(null);

  const [work, setWork] = useState<Work | null>(null);
  const [allWorks, setAllWorks] = useState<Work[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<SynopsisListItem[]>([]);
  const [currentId, setCurrentIdState] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<SynopsisFormState>(emptySynopsisForm);
  const [savedForm, setSavedForm] = useState<SynopsisFormState>(
    emptySynopsisForm,
  );
  const [isLoading, setIsLoading] = useState(isValidWorkId);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [busy, setBusy] = useState<BusyAction>("");
  const [actionError, setActionError] = useState("");
  const [pendingNav, setPendingNav] = useState<PendingNav | null>(null);

  const isDirty = selectedId != null && !isSameForm(form, savedForm);
  const isBusy = busy !== "";
  const currentItem = items.find((item) => item.id === currentId) ?? null;
  const selectedItem = items.find((item) => item.id === selectedId) ?? null;
  const isSelectedCurrent = selectedId != null && selectedId === currentId;

  const setCurrentId = (id: number | null) => {
    currentIdRef.current = id;
    setCurrentIdState(id);
  };

  const applyDetail = (
    detail: SynopsisDetail,
    nextCurrentId = currentIdRef.current,
  ) => {
    const nextForm = toFormState(detail);
    setForm(nextForm);
    setSavedForm(nextForm);
    setSelectedId(detail.id);
    setItems((current) => mergeItem(current, detail, nextCurrentId));
  };

  const loadDetail = async (synopsisId: number) => {
    detailAbortRef.current?.abort();
    const controller = new AbortController();
    detailAbortRef.current = controller;
    setIsDetailLoading(true);
    setActionError("");

    try {
      const detail = await getSynopsis(
        numericWorkId,
        synopsisId,
        controller.signal,
      );

      if (controller.signal.aborted) {
        return;
      }

      if (!detail) {
        setActionError(synopsisCopy.loadDetailError);
        return;
      }

      applyDetail(detail);
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setActionError(synopsisCopy.loadDetailError);
    } finally {
      if (!controller.signal.aborted) {
        setIsDetailLoading(false);
      }
    }
  };

  const loadPage = async () => {
    if (!isValidWorkId) return;

    try {
      const [workData, listData, workListData] = await Promise.all([
        getWork(numericWorkId),
        getSynopses(numericWorkId),
        getWorks().catch(() => []),
      ]);
      setWork(workData);
      setAllWorks(workListData);
      setLoadError(false);

      if (!listData) {
        setItems([]);
        setCurrentId(null);
        setSelectedId(null);
        return;
      }

      setItems(listData.items);
      setCurrentId(listData.currentId);
      const initialId = listData.currentId ?? listData.items[0]?.id ?? null;
      setSelectedId(initialId);
      if (initialId != null) {
        await loadDetail(initialId);
      }
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isValidWorkId) return;

    const controller = new AbortController();

    Promise.all([
      getWork(numericWorkId, controller.signal),
      getSynopses(numericWorkId, controller.signal),
      getWorks(controller.signal).catch(() => []),
    ])
      .then(([workData, listData, workListData]) => {
        if (controller.signal.aborted) return;
        setWork(workData);
        setAllWorks(workListData);
        setLoadError(false);

        if (!listData) {
          setItems([]);
          setCurrentId(null);
          setSelectedId(null);
          return;
        }

        setItems(listData.items);
        setCurrentId(listData.currentId);
        const initialId = listData.currentId ?? listData.items[0]?.id ?? null;
        setSelectedId(initialId);
        if (initialId != null) {
          void loadDetail(initialId);
        }
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

    return () => {
      controller.abort();
      detailAbortRef.current?.abort();
    };
    // First load only; loadDetail reads the latest copy from closure on later calls.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValidWorkId, numericWorkId]);

  const handleFieldChange = (
    field: keyof SynopsisFormState,
    value: string,
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setActionError("");
  };

  const saveSelected = async () => {
    if (!isValidWorkId || selectedId == null || isBusy) return false;
    if (!form.title.trim()) {
      setActionError(synopsisCopy.titleRequired);
      return false;
    }

    setBusy("save");
    setActionError("");

    try {
      const saved = await updateSynopsis(numericWorkId, selectedId, {
        title: form.title.trim(),
        summary: form.summary,
        beginning: form.beginning,
        development: form.development,
        crisis: form.crisis,
        ending: form.ending,
        memo: form.memo,
      });
      applyDetail(saved, currentId);
      return true;
    } catch (error: unknown) {
      setActionError(
        error instanceof Error ? error.message : synopsisCopy.saveError,
      );
      return false;
    } finally {
      setBusy("");
    }
  };

  const createVersion = async () => {
    if (!isValidWorkId || isBusy) return;

    setBusy("create");
    setActionError("");

    try {
      const created = await createSynopsis(numericWorkId);
      const nextCurrentId = created.isCurrent ? created.id : currentId;
      setCurrentId(nextCurrentId);
      applyDetail(created, nextCurrentId);
    } catch (error: unknown) {
      setActionError(
        error instanceof Error ? error.message : synopsisCopy.createError,
      );
    } finally {
      setBusy("");
    }
  };

  const duplicateCurrent = async () => {
    if (!isValidWorkId || currentId == null || isBusy) return;

    setBusy("duplicate");
    setActionError("");

    try {
      const created = await duplicateSynopsis(numericWorkId, currentId);
      applyDetail(created, currentId);
    } catch (error: unknown) {
      setActionError(
        error instanceof Error ? error.message : synopsisCopy.duplicateError,
      );
    } finally {
      setBusy("");
    }
  };

  const runPendingNav = async (next: PendingNav) => {
    if (next.type === "select") {
      setSelectedId(next.id);
      await loadDetail(next.id);
      return;
    }

    if (next.type === "create") {
      await createVersion();
      return;
    }

    await duplicateCurrent();
  };

  const requestNav = (next: PendingNav) => {
    if (isBusy || isDetailLoading) return;

    if (next.type === "select" && next.id === selectedId) {
      return;
    }

    if (isDirty) {
      setPendingNav(next);
      return;
    }

    void runPendingNav(next);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await saveSelected();
  };

  const handleConfirmSave = async () => {
    if (!pendingNav) return;
    const next = pendingNav;
    const saved = await saveSelected();
    if (!saved) return;
    setPendingNav(null);
    await runPendingNav(next);
  };

  const handleConfirmDiscard = async () => {
    if (!pendingNav) return;
    const next = pendingNav;
    setForm(savedForm);
    setPendingNav(null);
    await runPendingNav(next);
  };

  const handleSetCurrent = async () => {
    if (!isValidWorkId || selectedId == null || isSelectedCurrent || isBusy) {
      return;
    }

    setBusy("current");
    setActionError("");

    try {
      const result = await setCurrentSynopsis(numericWorkId, selectedId);
      setCurrentId(result.currentId);
      setItems((current) =>
        current.map((item) => ({
          ...item,
          isCurrent: item.id === result.currentId,
        })),
      );
    } catch (error: unknown) {
      setActionError(
        error instanceof Error ? error.message : synopsisCopy.currentError,
      );
    } finally {
      setBusy("");
    }
  };

  const handleDelete = async () => {
    if (!isValidWorkId || selectedId == null || isBusy) return;

    const base = isSelectedCurrent
      ? synopsisCopy.deleteCurrentConfirm
      : synopsisCopy.deleteConfirm;
    const message = isDirty
      ? `${base}\n\n${synopsisCopy.deleteUnsavedNote}`
      : base;

    if (!window.confirm(message)) return;

    setBusy("delete");
    setActionError("");

    try {
      const result = await deleteSynopsis(numericWorkId, selectedId);
      const remaining = items.filter((item) => item.id !== result.deletedId);
      const nextItems = remaining.map((item) => ({
        ...item,
        isCurrent: result.currentId === item.id,
      }));
      setItems(nextItems);
      setCurrentId(result.currentId);
      setPendingNav(null);

      const nextSelectedId = result.currentId ?? nextItems[0]?.id ?? null;
      setSelectedId(nextSelectedId);

      if (nextSelectedId == null) {
        setForm(emptySynopsisForm);
        setSavedForm(emptySynopsisForm);
        return;
      }

      await loadDetail(nextSelectedId);
    } catch (error: unknown) {
      setActionError(
        error instanceof Error ? error.message : synopsisCopy.deleteError,
      );
    } finally {
      setBusy("");
    }
  };

  const statusMessage = loadError
    ? copy.workspace.states.error
    : copy.workspace.states.notFound;

  const saveLabel =
    busy === "save"
      ? synopsisCopy.saving
      : isDirty
        ? synopsisCopy.unsaved
        : synopsisCopy.saved;

  return (
    <div className={workspaceStyles.workspaceShell}>
      <WorkspaceSidebar
        copy={copy.workspace}
        brand={copy.brand}
        workId={numericWorkId}
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

          <Link href="/works" className={workspaceStyles.mobileBrand}>
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
            <UserMenu />
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
            <Link href="/works">{copy.workspace.backToWorks}</Link>
          </main>
        ) : (
          <main className={styles.synopsisPage}>
            <header className={styles.pageHeader}>
              <Link href={`/works/${work.id}`}>
                <span aria-hidden="true">←</span>
                {synopsisCopy.backToHome}
              </Link>
              <h1>{synopsisCopy.title}</h1>
              <p>{synopsisCopy.description}</p>
              <div className={styles.currentMeta}>
                <strong>
                  {currentItem
                    ? synopsisCopy.currentValue(currentItem.title)
                    : synopsisCopy.currentNoneValue}
                </strong>
                {selectedItem && selectedItem.id !== currentId ? (
                  <span>{synopsisCopy.editingValue(selectedItem.title)}</span>
                ) : null}
              </div>
              {items.length > 0 ? (
                <div className={styles.headerActions}>
                  <button
                    className={styles.primaryButton}
                    type="button"
                    disabled={isBusy || isDetailLoading}
                    onClick={() => requestNav({ type: "create" })}
                  >
                    {busy === "create"
                      ? synopsisCopy.creating
                      : synopsisCopy.newVersion}
                  </button>
                  <button
                    className={styles.ghostButton}
                    type="button"
                    disabled={isBusy || isDetailLoading || currentId == null}
                    onClick={() => requestNav({ type: "duplicate" })}
                  >
                    {busy === "duplicate"
                      ? synopsisCopy.duplicating
                      : synopsisCopy.duplicateCurrent}
                  </button>
                </div>
              ) : null}
            </header>

            {items.length === 0 ? (
              <section className={styles.emptyState}>
                <span aria-hidden="true">✎</span>
                <h2>{synopsisCopy.empty}</h2>
                <p>{synopsisCopy.emptyDescription}</p>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => void createVersion()}
                >
                  {busy === "create"
                    ? synopsisCopy.creating
                    : synopsisCopy.createFirst}
                </button>
                {actionError ? (
                  <p className={styles.fieldError}>{actionError}</p>
                ) : null}
              </section>
            ) : (
              <>
                <div className={styles.versionBar}>
                  <div
                    className={styles.versionChips}
                    role="group"
                    aria-label={synopsisCopy.versions}
                  >
                    {items.map((item) => {
                      const selected = item.id === selectedId;

                      return (
                        <button
                          className={`${styles.versionChip} ${
                            selected ? styles.versionChipSelected : ""
                          }`}
                          type="button"
                          aria-pressed={selected}
                          disabled={isBusy}
                          key={item.id}
                          onClick={() =>
                            requestNav({ type: "select", id: item.id })
                          }
                        >
                          <strong>{item.title}</strong>
                          {item.isCurrent ? (
                            <span
                              className={`${styles.badge} ${styles.currentBadge}`}
                            >
                              {synopsisCopy.currentBadge}
                            </span>
                          ) : selected ? (
                            <span
                              className={`${styles.badge} ${styles.selectedBadge}`}
                            >
                              {synopsisCopy.selectedBadge}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>

                  <label className={styles.versionSelectWrap}>
                    <span>{synopsisCopy.versions}</span>
                    <select
                      value={selectedId ?? ""}
                      disabled={isBusy}
                      onChange={(event) =>
                        requestNav({
                          type: "select",
                          id: Number(event.target.value),
                        })
                      }
                    >
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.title}
                          {item.isCurrent
                            ? ` · ${synopsisCopy.currentBadge}`
                            : item.id === selectedId
                              ? ` · ${synopsisCopy.selectedBadge}`
                              : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {isDetailLoading && !form.title && !isDirty ? (
                  <p className={styles.detailStatus}>
                    {synopsisCopy.loadingDetail}
                  </p>
                ) : (
                  <form
                    className={styles.synopsisForm}
                    onSubmit={(event) => void handleSave(event)}
                  >
                    <label className={styles.field}>
                      <span>{synopsisCopy.versionName}</span>
                      <input
                        type="text"
                        maxLength={SYNOPSIS_TITLE_MAX}
                        value={form.title}
                        placeholder={synopsisCopy.versionNamePlaceholder}
                        disabled={isDetailLoading}
                        onChange={(event) =>
                          handleFieldChange("title", event.target.value)
                        }
                      />
                    </label>

                    <label className={`${styles.field} ${styles.summaryField}`}>
                      <span>{synopsisCopy.summary}</span>
                      <textarea
                        rows={4}
                        value={form.summary}
                        placeholder={synopsisCopy.summaryPlaceholder}
                        disabled={isDetailLoading}
                        onChange={(event) =>
                          handleFieldChange("summary", event.target.value)
                        }
                      />
                    </label>

                    <label className={styles.field}>
                      <span>{synopsisCopy.beginning}</span>
                      <textarea
                        rows={6}
                        value={form.beginning}
                        placeholder={synopsisCopy.beginningPlaceholder}
                        disabled={isDetailLoading}
                        onChange={(event) =>
                          handleFieldChange("beginning", event.target.value)
                        }
                      />
                    </label>

                    <label className={styles.field}>
                      <span>{synopsisCopy.development}</span>
                      <textarea
                        rows={6}
                        value={form.development}
                        placeholder={synopsisCopy.developmentPlaceholder}
                        disabled={isDetailLoading}
                        onChange={(event) =>
                          handleFieldChange("development", event.target.value)
                        }
                      />
                    </label>

                    <label className={styles.field}>
                      <span>{synopsisCopy.crisis}</span>
                      <textarea
                        rows={6}
                        value={form.crisis}
                        placeholder={synopsisCopy.crisisPlaceholder}
                        disabled={isDetailLoading}
                        onChange={(event) =>
                          handleFieldChange("crisis", event.target.value)
                        }
                      />
                    </label>

                    <label className={styles.field}>
                      <span>{synopsisCopy.ending}</span>
                      <textarea
                        rows={6}
                        value={form.ending}
                        placeholder={synopsisCopy.endingPlaceholder}
                        disabled={isDetailLoading}
                        onChange={(event) =>
                          handleFieldChange("ending", event.target.value)
                        }
                      />
                    </label>

                    <label
                      className={`${styles.field} ${styles.memoField}`}
                    >
                      <span>{synopsisCopy.memo}</span>
                      <textarea
                        rows={4}
                        value={form.memo}
                        placeholder={synopsisCopy.memoPlaceholder}
                        disabled={isDetailLoading}
                        onChange={(event) =>
                          handleFieldChange("memo", event.target.value)
                        }
                      />
                      <small className={styles.memoHint}>
                        {synopsisCopy.memoHint}
                      </small>
                    </label>

                    <div className={styles.formActions}>
                      {isSelectedCurrent ? (
                        <button
                          className={styles.ghostButton}
                          type="button"
                          disabled
                        >
                          {synopsisCopy.currentStatus}
                        </button>
                      ) : (
                        <button
                          className={styles.ghostButton}
                          type="button"
                          disabled={isBusy || isDetailLoading || selectedId == null}
                          onClick={() => void handleSetCurrent()}
                        >
                          {busy === "current"
                            ? synopsisCopy.settingCurrent
                            : synopsisCopy.setCurrent}
                        </button>
                      )}
                      <button
                        className={styles.dangerButton}
                        type="button"
                        disabled={isBusy || isDetailLoading || selectedId == null}
                        onClick={() => void handleDelete()}
                      >
                        {busy === "delete"
                          ? synopsisCopy.deleting
                          : synopsisCopy.deleteVersion}
                      </button>
                      {isDirty ? (
                        <p className={styles.dirtyHint}>
                          {synopsisCopy.dirtyCurrentHint}
                        </p>
                      ) : null}
                    </div>

                    <div className={styles.saveBar}>
                      <span>{saveLabel}</span>
                      <button type="submit" disabled={isBusy || !isDirty}>
                        {busy === "save"
                          ? synopsisCopy.saving
                          : synopsisCopy.save}
                      </button>
                    </div>
                    {actionError ? (
                      <p className={styles.saveError}>{actionError}</p>
                    ) : null}
                  </form>
                )}
              </>
            )}
          </main>
        )}
      </div>

      {pendingNav ? (
        <div className={styles.confirmOverlay}>
          <div
            className={styles.confirmCard}
            role="dialog"
            aria-modal="true"
            aria-labelledby="synopsis-unsaved-title"
          >
            <h2 id="synopsis-unsaved-title">{synopsisCopy.unsavedTitle}</h2>
            <p>{synopsisCopy.unsavedDescription}</p>
            <div className={styles.confirmActions}>
              <button
                className={styles.primaryButton}
                type="button"
                disabled={isBusy}
                onClick={() => void handleConfirmSave()}
              >
                {synopsisCopy.saveAndContinue}
              </button>
              <button
                className={styles.ghostButton}
                type="button"
                disabled={isBusy}
                onClick={() => void handleConfirmDiscard()}
              >
                {synopsisCopy.discardAndContinue}
              </button>
              <button
                className={styles.ghostButton}
                type="button"
                disabled={isBusy}
                onClick={() => setPendingNav(null)}
              >
                {synopsisCopy.cancel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
