"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import UserMenu from "@/components/auth/UserMenu";
import WorkSearch from "@/components/work/WorkSearch";
import WorkspaceSidebar from "@/components/workspace/WorkspaceSidebar";
import { defaultLocale, getMessages } from "@/i18n/messages";
import { getPlanning, updatePlanning } from "@/lib/planning-api";
import { getWork, getWorks } from "@/lib/work-api";
import type {
  Planning,
  PlanningCustomField,
  PlanningCustomFieldDraft,
} from "@/types/planning";
import type { Work } from "@/types/work";
import planningStyles from "@/app/works/[workId]/planning/planning.module.css";
import workspaceStyles from "@/app/works/[workId]/workspace.module.css";

interface WorkPlanningPageProps {
  workId: string;
}

interface PlanningFormState {
  genre: string;
  subgenre: string;
  targetAudience: string;
  keywords: string;
  logline: string;
  introduction: string;
}

const emptyForm: PlanningFormState = {
  genre: "",
  subgenre: "",
  targetAudience: "",
  keywords: "",
  logline: "",
  introduction: "",
};

function toFormState(planning: Planning): PlanningFormState {
  return {
    genre: planning.genre,
    subgenre: planning.subgenre,
    targetAudience: planning.targetAudience,
    keywords: planning.keywords,
    logline: planning.logline,
    introduction: planning.introduction,
  };
}

function normalizeCustomFields(
  fields: PlanningCustomFieldDraft[],
): PlanningCustomFieldDraft[] {
  return fields.map((field, index) => ({
    ...field,
    sortOrder: index,
  }));
}

function toDraftCustomFields(
  fields: PlanningCustomField[],
): PlanningCustomFieldDraft[] {
  return normalizeCustomFields(
    [...fields]
      .sort((left, right) => left.sortOrder - right.sortOrder || left.id - right.id)
      .map((field) => ({
        clientKey: `saved-${field.id}`,
        id: field.id,
        label: field.label,
        value: field.value,
        sortOrder: field.sortOrder,
      })),
  );
}

function areCustomFieldsEqual(
  current: PlanningCustomFieldDraft[],
  saved: PlanningCustomFieldDraft[],
) {
  if (current.length !== saved.length) return false;

  return current.every((field, index) => {
    const other = saved[index];
    return (
      field.id === other.id &&
      field.label === other.label &&
      field.value === other.value &&
      field.sortOrder === other.sortOrder
    );
  });
}

export default function WorkPlanningPage({ workId }: WorkPlanningPageProps) {
  const locale = defaultLocale;
  const copy = getMessages(locale);
  const numericWorkId = Number(workId);
  const isValidWorkId = Number.isInteger(numericWorkId) && numericWorkId > 0;
  const nextFieldKey = useRef(0);

  const [work, setWork] = useState<Work | null>(null);
  const [allWorks, setAllWorks] = useState<Work[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState<PlanningFormState>(emptyForm);
  const [savedForm, setSavedForm] = useState<PlanningFormState>(emptyForm);
  const [customFields, setCustomFields] = useState<PlanningCustomFieldDraft[]>(
    [],
  );
  const [savedCustomFields, setSavedCustomFields] = useState<
    PlanningCustomFieldDraft[]
  >([]);
  const [labelErrors, setLabelErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(isValidWorkId);
  const [loadError, setLoadError] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const isDirty =
    form.genre !== savedForm.genre ||
    form.subgenre !== savedForm.subgenre ||
    form.targetAudience !== savedForm.targetAudience ||
    form.keywords !== savedForm.keywords ||
    form.logline !== savedForm.logline ||
    form.introduction !== savedForm.introduction ||
    !areCustomFieldsEqual(customFields, savedCustomFields);

  const applyPlanning = (planning: Planning) => {
    const nextForm = toFormState(planning);
    const nextFields = toDraftCustomFields(planning.customFields);
    setForm(nextForm);
    setSavedForm(nextForm);
    setCustomFields(nextFields);
    setSavedCustomFields(nextFields);
    setLabelErrors([]);
  };

  const loadPage = async () => {
    if (!isValidWorkId) return;

    try {
      const [workData, planningData, workListData] = await Promise.all([
        getWork(numericWorkId),
        getPlanning(numericWorkId),
        getWorks().catch(() => []),
      ]);
      setWork(workData);
      setAllWorks(workListData);
      setLoadError(false);
      if (planningData) {
        applyPlanning(planningData);
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
      getPlanning(numericWorkId, controller.signal),
      getWorks(controller.signal).catch(() => []),
    ])
      .then(([workData, planningData, workListData]) => {
        setWork(workData);
        setAllWorks(workListData);
        setLoadError(false);
        if (planningData) {
          applyPlanning(planningData);
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

    return () => controller.abort();
  }, [isValidWorkId, numericWorkId]);

  const statusMessage = loadError
    ? copy.workspace.states.error
    : copy.workspace.states.notFound;

  const handleFieldChange = (
    field: keyof PlanningFormState,
    value: string,
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setSaveError("");
  };

  const handleCustomFieldChange = (
    clientKey: string,
    field: "label" | "value",
    value: string,
  ) => {
    setCustomFields((current) =>
      current.map((item) =>
        item.clientKey === clientKey ? { ...item, [field]: value } : item,
      ),
    );
    setSaveError("");
    if (field === "label") {
      setLabelErrors((current) =>
        current.filter((key) => key !== clientKey),
      );
    }
  };

  const handleAddCustomField = () => {
    nextFieldKey.current += 1;
    setCustomFields((current) =>
      normalizeCustomFields([
        ...current,
        {
          clientKey: `new-${nextFieldKey.current}`,
          label: "",
          value: "",
          sortOrder: current.length,
        },
      ]),
    );
    setSaveError("");
  };

  const handleMoveCustomField = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= customFields.length) return;

    const next = [...customFields];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    setCustomFields(normalizeCustomFields(next));
    setSaveError("");
  };

  const handleDeleteCustomField = (clientKey: string) => {
    if (!window.confirm(copy.workspace.planning.deleteConfirm)) return;

    setCustomFields((current) =>
      normalizeCustomFields(
        current.filter((field) => field.clientKey !== clientKey),
      ),
    );
    setLabelErrors((current) => current.filter((key) => key !== clientKey));
    setSaveError("");
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isValidWorkId || isSaving || !isDirty) return;

    const blankLabels = customFields
      .filter((field) => !field.label.trim())
      .map((field) => field.clientKey);

    if (blankLabels.length > 0) {
      setLabelErrors(blankLabels);
      return;
    }

    setIsSaving(true);
    setSaveError("");

    try {
      const savedPlanning = await updatePlanning(numericWorkId, {
        ...form,
        customFields: customFields.map((field) => ({
          ...(field.id != null ? { id: field.id } : {}),
          label: field.label.trim(),
          value: field.value,
          sortOrder: field.sortOrder,
        })),
      });
      applyPlanning(savedPlanning);
    } catch {
      setSaveError(copy.workspace.planning.saveError);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={workspaceStyles.workspaceShell}>
      <WorkspaceSidebar
        copy={copy.workspace}
        brand={copy.brand}
        workId={numericWorkId}
        activeMenu="planning"
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
              activeMenu="planning"
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
          <main className={planningStyles.planningPage}>
            <header className={planningStyles.pageHeader}>
              <div>
                <Link href={`/works/${work.id}`}>
                  <span aria-hidden="true">←</span>
                  {copy.workspace.planning.backToHome}
                </Link>
                <h1>{copy.workspace.planning.title}</h1>
                <p>{copy.workspace.planning.description}</p>
              </div>
            </header>

            <form
              className={planningStyles.planningForm}
              onSubmit={(event) => void handleSave(event)}
            >
              <label className={planningStyles.field}>
                <span>{copy.workspace.planning.genre}</span>
                <input
                  type="text"
                  maxLength={100}
                  value={form.genre}
                  placeholder={copy.workspace.planning.genrePlaceholder}
                  onChange={(event) =>
                    handleFieldChange("genre", event.target.value)
                  }
                />
              </label>

              <label className={planningStyles.field}>
                <span>{copy.workspace.planning.subgenre}</span>
                <input
                  type="text"
                  maxLength={100}
                  value={form.subgenre}
                  placeholder={copy.workspace.planning.subgenrePlaceholder}
                  onChange={(event) =>
                    handleFieldChange("subgenre", event.target.value)
                  }
                />
              </label>

              <label className={planningStyles.field}>
                <span>{copy.workspace.planning.targetAudience}</span>
                <textarea
                  rows={3}
                  maxLength={200}
                  value={form.targetAudience}
                  placeholder={
                    copy.workspace.planning.targetAudiencePlaceholder
                  }
                  onChange={(event) =>
                    handleFieldChange("targetAudience", event.target.value)
                  }
                />
              </label>

              <label className={planningStyles.field}>
                <span>{copy.workspace.planning.keywords}</span>
                <input
                  type="text"
                  maxLength={500}
                  value={form.keywords}
                  placeholder={copy.workspace.planning.keywordsPlaceholder}
                  onChange={(event) =>
                    handleFieldChange("keywords", event.target.value)
                  }
                />
              </label>

              <label className={planningStyles.field}>
                <span>{copy.workspace.planning.logline}</span>
                <textarea
                  rows={4}
                  value={form.logline}
                  placeholder={copy.workspace.planning.loglinePlaceholder}
                  onChange={(event) =>
                    handleFieldChange("logline", event.target.value)
                  }
                />
              </label>

              <label className={planningStyles.field}>
                <span>{copy.workspace.planning.introduction}</span>
                <textarea
                  rows={8}
                  value={form.introduction}
                  placeholder={
                    copy.workspace.planning.introductionPlaceholder
                  }
                  onChange={(event) =>
                    handleFieldChange("introduction", event.target.value)
                  }
                />
              </label>

              <section className={planningStyles.customSection}>
                <header>
                  <h2>{copy.workspace.planning.customTitle}</h2>
                  <p>{copy.workspace.planning.customDescription}</p>
                </header>

                {customFields.length === 0 ? (
                  <p className={planningStyles.customEmpty}>
                    {copy.workspace.planning.customEmpty}
                  </p>
                ) : (
                  <ul className={planningStyles.customList}>
                    {customFields.map((field, index) => {
                      const hasLabelError = labelErrors.includes(
                        field.clientKey,
                      );

                      return (
                        <li
                          className={planningStyles.customItem}
                          key={field.clientKey}
                        >
                          <label className={planningStyles.field}>
                            <span className={planningStyles.srOnly}>
                              {copy.workspace.planning.fieldLabelPlaceholder}
                            </span>
                            <input
                              type="text"
                              maxLength={100}
                              value={field.label}
                              placeholder={
                                copy.workspace.planning.fieldLabelPlaceholder
                              }
                              aria-invalid={hasLabelError}
                              onChange={(event) =>
                                handleCustomFieldChange(
                                  field.clientKey,
                                  "label",
                                  event.target.value,
                                )
                              }
                            />
                          </label>
                          {hasLabelError ? (
                            <p className={planningStyles.fieldError}>
                              {copy.workspace.planning.labelRequired}
                            </p>
                          ) : null}
                          <label className={planningStyles.field}>
                            <span className={planningStyles.srOnly}>
                              {copy.workspace.planning.fieldValuePlaceholder}
                            </span>
                            <textarea
                              rows={3}
                              value={field.value}
                              placeholder={
                                copy.workspace.planning.fieldValuePlaceholder
                              }
                              onChange={(event) =>
                                handleCustomFieldChange(
                                  field.clientKey,
                                  "value",
                                  event.target.value,
                                )
                              }
                            />
                          </label>
                          <div className={planningStyles.customActions}>
                            <button
                              type="button"
                              disabled={index === 0}
                              aria-label={copy.workspace.planning.moveUp}
                              onClick={() => handleMoveCustomField(index, -1)}
                            >
                              {copy.workspace.planning.moveUp}
                            </button>
                            <button
                              type="button"
                              disabled={index === customFields.length - 1}
                              aria-label={copy.workspace.planning.moveDown}
                              onClick={() => handleMoveCustomField(index, 1)}
                            >
                              {copy.workspace.planning.moveDown}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteCustomField(field.clientKey)
                              }
                            >
                              {copy.workspace.planning.deleteField}
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}

                <button
                  className={planningStyles.addFieldButton}
                  type="button"
                  onClick={handleAddCustomField}
                >
                  {copy.workspace.planning.addField}
                </button>
              </section>

              <div className={planningStyles.saveBar}>
                <span>
                  {isSaving
                    ? copy.workspace.planning.saving
                    : isDirty
                      ? copy.workspace.planning.unsaved
                      : copy.workspace.planning.saved}
                </span>
                <button type="submit" disabled={isSaving || !isDirty}>
                  {isSaving
                    ? copy.workspace.planning.saving
                    : copy.workspace.planning.save}
                </button>
              </div>
              {saveError ? (
                <p className={planningStyles.saveError}>{saveError}</p>
              ) : null}
            </form>
          </main>
        )}
      </div>
    </div>
  );
}
