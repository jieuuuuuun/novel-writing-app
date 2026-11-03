"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import UserMenu from "@/components/auth/UserMenu";
import WorkSearch from "@/components/work/WorkSearch";
import WorkspaceSidebar from "@/components/workspace/WorkspaceSidebar";
import { defaultLocale, getMessages } from "@/i18n/messages";
import { getWork, getWorks } from "@/lib/work-api";
import { getWorldSetting, updateWorldSetting } from "@/lib/world-api";
import type { Work } from "@/types/work";
import type {
  WorldSetting,
  WorldSettingCustomField,
  WorldSettingCustomFieldDraft,
} from "@/types/world";
import workspaceStyles from "@/app/works/[workId]/workspace.module.css";
import styles from "@/app/works/[workId]/world/world.module.css";

interface WorkWorldPageProps {
  workId: string;
}

interface WorldFormState {
  era: string;
  places: string;
  atmosphere: string;
}

const emptyForm: WorldFormState = {
  era: "",
  places: "",
  atmosphere: "",
};

function toFormState(world: WorldSetting): WorldFormState {
  return {
    era: world.era,
    places: world.places,
    atmosphere: world.atmosphere,
  };
}

function normalizeCustomFields(
  fields: WorldSettingCustomFieldDraft[],
): WorldSettingCustomFieldDraft[] {
  return fields.map((field, index) => ({
    ...field,
    sortOrder: index,
  }));
}

function toDraftCustomFields(
  fields: WorldSettingCustomField[],
): WorldSettingCustomFieldDraft[] {
  return normalizeCustomFields(
    [...fields]
      .sort(
        (left, right) =>
          left.sortOrder - right.sortOrder || left.id - right.id,
      )
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
  current: WorldSettingCustomFieldDraft[],
  saved: WorldSettingCustomFieldDraft[],
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

export default function WorkWorldPage({ workId }: WorkWorldPageProps) {
  const locale = defaultLocale;
  const copy = getMessages(locale);
  const worldCopy = copy.workspace.world;
  const numericWorkId = Number(workId);
  const isValidWorkId = Number.isInteger(numericWorkId) && numericWorkId > 0;
  const nextFieldKey = useRef(0);

  const [work, setWork] = useState<Work | null>(null);
  const [allWorks, setAllWorks] = useState<Work[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState<WorldFormState>(emptyForm);
  const [savedForm, setSavedForm] = useState<WorldFormState>(emptyForm);
  const [customFields, setCustomFields] = useState<
    WorldSettingCustomFieldDraft[]
  >([]);
  const [savedCustomFields, setSavedCustomFields] = useState<
    WorldSettingCustomFieldDraft[]
  >([]);
  const [labelErrors, setLabelErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(isValidWorkId);
  const [loadError, setLoadError] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const isDirty =
    form.era !== savedForm.era ||
    form.places !== savedForm.places ||
    form.atmosphere !== savedForm.atmosphere ||
    !areCustomFieldsEqual(customFields, savedCustomFields);

  const applyWorld = (world: WorldSetting) => {
    const nextForm = toFormState(world);
    const nextFields = toDraftCustomFields(world.customFields);
    setForm(nextForm);
    setSavedForm(nextForm);
    setCustomFields(nextFields);
    setSavedCustomFields(nextFields);
    setLabelErrors([]);
  };

  const loadPage = async () => {
    if (!isValidWorkId) return;

    try {
      const [workData, worldData, workListData] = await Promise.all([
        getWork(numericWorkId),
        getWorldSetting(numericWorkId),
        getWorks().catch(() => []),
      ]);
      setWork(workData);
      setAllWorks(workListData);
      setLoadError(false);
      if (worldData) {
        applyWorld(worldData);
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
      getWorldSetting(numericWorkId, controller.signal),
      getWorks(controller.signal).catch(() => []),
    ])
      .then(([workData, worldData, workListData]) => {
        setWork(workData);
        setAllWorks(workListData);
        setLoadError(false);
        if (worldData) {
          applyWorld(worldData);
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

  const handleFieldChange = (field: keyof WorldFormState, value: string) => {
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
    const target = customFields.find((field) => field.clientKey === clientKey);
    if (!target) return;
    if (target.id != null && !window.confirm(worldCopy.deleteConfirm)) {
      return;
    }

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
      setSaveError(worldCopy.labelRequired);
      return;
    }

    setIsSaving(true);
    setSaveError("");

    try {
      const savedWorld = await updateWorldSetting(numericWorkId, {
        era: form.era,
        places: form.places,
        atmosphere: form.atmosphere,
        customFields: customFields.map((field, index) => ({
          ...(field.id != null ? { id: field.id } : {}),
          label: field.label.trim(),
          value: field.value,
          sortOrder: index,
        })),
      });
      applyWorld(savedWorld);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "";
      setSaveError(
        message.includes("Invalid custom field")
          ? worldCopy.customFieldInvalid
          : worldCopy.saveError,
      );
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
        activeMenu="world"
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
              activeMenu="world"
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
          <main className={styles.worldPage}>
            <header className={styles.pageHeader}>
              <div>
                <Link href={`/works/${work.id}`}>
                  <span aria-hidden="true">←</span>
                  {worldCopy.backToHome}
                </Link>
                <h1>{worldCopy.title}</h1>
                <p>{worldCopy.description}</p>
              </div>
            </header>

            <form
              className={styles.worldForm}
              onSubmit={(event) => void handleSave(event)}
            >
              <label className={styles.field}>
                <span>{worldCopy.era}</span>
                <textarea
                  rows={5}
                  value={form.era}
                  placeholder={worldCopy.eraPlaceholder}
                  onChange={(event) =>
                    handleFieldChange("era", event.target.value)
                  }
                />
              </label>

              <label className={styles.field}>
                <span>{worldCopy.places}</span>
                <textarea
                  rows={5}
                  value={form.places}
                  placeholder={worldCopy.placesPlaceholder}
                  onChange={(event) =>
                    handleFieldChange("places", event.target.value)
                  }
                />
              </label>

              <label className={styles.field}>
                <span>{worldCopy.atmosphere}</span>
                <textarea
                  rows={5}
                  value={form.atmosphere}
                  placeholder={worldCopy.atmospherePlaceholder}
                  onChange={(event) =>
                    handleFieldChange("atmosphere", event.target.value)
                  }
                />
              </label>

              <section className={styles.customSection}>
                <header>
                  <h2>{worldCopy.customTitle}</h2>
                  <p>{worldCopy.customDescription}</p>
                </header>

                {customFields.length === 0 ? (
                  <p className={styles.customEmpty}>{worldCopy.customEmpty}</p>
                ) : (
                  <ul className={styles.customList}>
                    {customFields.map((field, index) => {
                      const hasLabelError = labelErrors.includes(
                        field.clientKey,
                      );

                      return (
                        <li className={styles.customItem} key={field.clientKey}>
                          <label className={styles.field}>
                            <span className={styles.srOnly}>
                              {worldCopy.fieldLabelPlaceholder}
                            </span>
                            <input
                              type="text"
                              maxLength={100}
                              value={field.label}
                              placeholder={worldCopy.fieldLabelPlaceholder}
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
                            <p className={styles.fieldError}>
                              {worldCopy.labelRequired}
                            </p>
                          ) : null}
                          <label className={styles.field}>
                            <span className={styles.srOnly}>
                              {worldCopy.fieldValuePlaceholder}
                            </span>
                            <textarea
                              rows={3}
                              value={field.value}
                              placeholder={worldCopy.fieldValuePlaceholder}
                              onChange={(event) =>
                                handleCustomFieldChange(
                                  field.clientKey,
                                  "value",
                                  event.target.value,
                                )
                              }
                            />
                          </label>
                          <div className={styles.customActions}>
                            <button
                              type="button"
                              disabled={index === 0}
                              aria-label={worldCopy.moveUpLabel}
                              onClick={() => handleMoveCustomField(index, -1)}
                            >
                              {worldCopy.moveUp}
                            </button>
                            <button
                              type="button"
                              disabled={index === customFields.length - 1}
                              aria-label={worldCopy.moveDownLabel}
                              onClick={() => handleMoveCustomField(index, 1)}
                            >
                              {worldCopy.moveDown}
                            </button>
                            <button
                              type="button"
                              aria-label={worldCopy.deleteField}
                              onClick={() =>
                                handleDeleteCustomField(field.clientKey)
                              }
                            >
                              {worldCopy.deleteField}
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}

                <button
                  className={styles.addFieldButton}
                  type="button"
                  onClick={handleAddCustomField}
                >
                  {worldCopy.addField}
                </button>
              </section>

              <div className={styles.saveBar}>
                <span>
                  {isSaving
                    ? worldCopy.saving
                    : isDirty
                      ? worldCopy.unsaved
                      : worldCopy.saved}
                </span>
                <button type="submit" disabled={isSaving || !isDirty}>
                  {isSaving ? worldCopy.saving : worldCopy.save}
                </button>
              </div>
              {saveError ? <p className={styles.saveError}>{saveError}</p> : null}
            </form>
          </main>
        )}
      </div>
    </div>
  );
}
