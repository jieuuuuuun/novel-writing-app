"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import UserMenu from "@/components/auth/UserMenu";
import WorkSearch from "@/components/work/WorkSearch";
import WorkspaceSidebar from "@/components/workspace/WorkspaceSidebar";
import { defaultLocale, getMessages, type Messages } from "@/i18n/messages";
import { getCharacters } from "@/lib/character-api";
import {
  createRelation,
  deleteRelation,
  getRelation,
  updateRelation,
} from "@/lib/relation-api";
import { getWork, getWorks } from "@/lib/work-api";
import type { Character } from "@/types/character";
import {
  RELATION_FIELD_LIMITS,
  emptyRelationForm,
  type CreateRelationInput,
  type Relation,
  type RelationFormState,
} from "@/types/relation";
import type { Work } from "@/types/work";
import RelationForm from "./RelationForm";
import sheetStyles from "@/app/works/[workId]/relations/relation-sheet.module.css";
import workspaceStyles from "@/app/works/[workId]/workspace.module.css";

interface RelationSheetPageProps {
  workId: string;
  relationId?: string;
  mode?: "create" | "edit";
}

type RelationSheetCopy = Messages["workspace"]["relationSheet"];
type RelationFieldErrors = Partial<
  Record<keyof RelationFormState | "pair", string>
>;

function toRelationFormState(relation: Relation): RelationFormState {
  return {
    characterAId: String(relation.characterA.id),
    characterBId: String(relation.characterB.id),
    type: relation.type,
    summary: relation.summary,
    aToBLabel: relation.aToBLabel,
    aToBNote: relation.aToBNote,
    bToALabel: relation.bToALabel,
    bToANote: relation.bToANote,
  };
}

function isSameRelationForm(
  left: RelationFormState,
  right: RelationFormState,
) {
  return (
    Object.keys(emptyRelationForm) as Array<keyof RelationFormState>
  ).every((field) => left[field] === right[field]);
}

function toRelationPayload(form: RelationFormState): CreateRelationInput {
  return {
    characterAId: Number(form.characterAId),
    characterBId: Number(form.characterBId),
    type: form.type.trim(),
    summary: form.summary.trim(),
    aToBLabel: form.aToBLabel.trim(),
    aToBNote: form.aToBNote,
    bToALabel: form.bToALabel.trim(),
    bToANote: form.bToANote,
  };
}

function validateRelationForm(
  form: RelationFormState,
  copy: RelationSheetCopy,
): RelationFieldErrors {
  const errors: RelationFieldErrors = {};
  const characterAId = Number(form.characterAId);
  const characterBId = Number(form.characterBId);
  const hasA = Number.isInteger(characterAId) && characterAId > 0;
  const hasB = Number.isInteger(characterBId) && characterBId > 0;

  if (!hasA || !hasB || characterAId === characterBId) {
    errors.pair = copy.pairRequired;
  }

  if (form.type.trim().length > RELATION_FIELD_LIMITS.type) {
    errors.type = copy.tooLong(RELATION_FIELD_LIMITS.type);
  }

  if (form.summary.trim().length > RELATION_FIELD_LIMITS.summary) {
    errors.summary = copy.tooLong(RELATION_FIELD_LIMITS.summary);
  }

  if (form.aToBLabel.trim().length > RELATION_FIELD_LIMITS.label) {
    errors.aToBLabel = copy.tooLong(RELATION_FIELD_LIMITS.label);
  }

  if (form.bToALabel.trim().length > RELATION_FIELD_LIMITS.label) {
    errors.bToALabel = copy.tooLong(RELATION_FIELD_LIMITS.label);
  }

  return errors;
}

function isDuplicateRelationError(error: unknown) {
  return (
    error instanceof Error && error.message.includes("Relation already exists")
  );
}

export default function RelationSheetPage({
  workId,
  relationId,
  mode = "create",
}: RelationSheetPageProps) {
  const locale = defaultLocale;
  const copy = getMessages(locale);
  const router = useRouter();
  const numericWorkId = Number(workId);
  const numericRelationId = Number(relationId);
  const isValidWorkId = Number.isInteger(numericWorkId) && numericWorkId > 0;
  const isValidRelationId =
    Number.isInteger(numericRelationId) && numericRelationId > 0;
  const isEdit = mode === "edit";
  const isValidRoute =
    isValidWorkId && (mode === "create" || isValidRelationId);
  const listHref = `/works/${numericWorkId}/relations`;
  const sheetCopy = copy.workspace.relationSheet;
  const listCopy = copy.workspace.relationList;

  const [work, setWork] = useState<Work | null>(null);
  const [relation, setRelation] = useState<Relation | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [allWorks, setAllWorks] = useState<Work[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState<RelationFormState>(emptyRelationForm);
  const [savedForm, setSavedForm] = useState<RelationFormState>(
    emptyRelationForm,
  );
  const [fieldErrors, setFieldErrors] = useState<RelationFieldErrors>({});
  const [isLoading, setIsLoading] = useState(isValidRoute);
  const [loadError, setLoadError] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const isDirty = !isSameRelationForm(form, savedForm);
  const hasSheetData = work !== null && (!isEdit || relation !== null);

  const applyRelation = (nextRelation: Relation) => {
    const nextForm = toRelationFormState(nextRelation);
    setRelation(nextRelation);
    setForm(nextForm);
    setSavedForm(nextForm);
    setFieldErrors({});
  };

  const loadPage = async () => {
    if (!isValidRoute) return;

    try {
      const [workData, characterData, relationData, workListData] =
        await Promise.all([
          getWork(numericWorkId),
          getCharacters(numericWorkId),
          isEdit
            ? getRelation(numericWorkId, numericRelationId)
            : Promise.resolve(null),
          getWorks().catch(() => []),
        ]);
      setWork(
        workData && characterData && (!isEdit || relationData)
          ? workData
          : null,
      );
      setCharacters(characterData ?? []);
      setAllWorks(workListData);
      if (isEdit && relationData) {
        applyRelation(relationData);
      } else {
        setRelation(relationData);
      }
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isValidRoute) return;

    const controller = new AbortController();

    Promise.all([
      getWork(numericWorkId, controller.signal),
      getCharacters(numericWorkId, controller.signal),
      isEdit
        ? getRelation(numericWorkId, numericRelationId, controller.signal)
        : Promise.resolve(null),
      getWorks(controller.signal).catch(() => []),
    ])
      .then(([workData, characterData, relationData, workListData]) => {
        setWork(
          workData && characterData && (!isEdit || relationData)
            ? workData
            : null,
        );
        setCharacters(characterData ?? []);
        setAllWorks(workListData);
        if (isEdit && relationData) {
          applyRelation(relationData);
        } else {
          setRelation(relationData);
        }
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
  }, [isEdit, isValidRoute, numericRelationId, numericWorkId]);

  const statusMessage = loadError
    ? copy.workspace.states.error
    : copy.workspace.states.notFound;

  const handleFieldChange = (
    field: keyof RelationFormState,
    value: string,
  ) => {
    setForm((current) => {
      const next = { ...current, [field]: value };

      if (field === "characterAId" && value && value === current.characterBId) {
        next.characterBId = "";
      }

      if (field === "characterBId" && value && value === current.characterAId) {
        next.characterBId = "";
      }

      return next;
    });
    setFieldErrors((current) => {
      if (!current[field] && !current.pair) return current;
      const next = { ...current };
      delete next[field];
      if (field === "characterAId" || field === "characterBId") {
        delete next.pair;
      }
      return next;
    });
    setSaveError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValidRoute || isSaving || isDeleting) return;
    if (isEdit && !isDirty) return;

    const errors = validateRelationForm(form, sheetCopy);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSaving(true);
    setSaveError("");

    const payload = toRelationPayload(form);

    try {
      if (isEdit) {
        const updatedRelation = await updateRelation(
          numericWorkId,
          numericRelationId,
          payload,
        );
        applyRelation(updatedRelation);
        setIsSaving(false);
        return;
      }

      await createRelation(numericWorkId, payload);
      router.replace(listHref);
    } catch (error: unknown) {
      setSaveError(
        isDuplicateRelationError(error)
          ? sheetCopy.duplicateError
          : isEdit
            ? sheetCopy.updateError
            : sheetCopy.saveError,
      );
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit || !isValidRelationId || isSaving || isDeleting) return;
    if (!window.confirm(sheetCopy.deleteConfirm)) return;

    setIsDeleting(true);
    setDeleteError("");

    try {
      await deleteRelation(numericWorkId, numericRelationId);
      router.replace(listHref);
    } catch {
      setDeleteError(sheetCopy.deleteError);
      setIsDeleting(false);
    }
  };

  const emptyState =
    !isEdit && characters.length === 0
      ? {
          title: listCopy.emptyNoCharacters,
          description: listCopy.emptyNoCharactersDescription,
        }
      : !isEdit && characters.length === 1
        ? {
            title: listCopy.emptyOneCharacter,
            description: listCopy.emptyOneCharacterDescription,
          }
        : null;

  return (
    <div className={workspaceStyles.workspaceShell}>
      <WorkspaceSidebar
        copy={copy.workspace}
        brand={copy.brand}
        workId={numericWorkId}
        activeMenu="relationships"
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
              activeMenu="relationships"
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
        ) : loadError || !hasSheetData ? (
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
          <main className={sheetStyles.sheetPage}>
            <header className={sheetStyles.pageHeader}>
              <Link href={listHref}>
                <span aria-hidden="true">←</span>
                {sheetCopy.backToList}
              </Link>
              <h1>
                {isEdit ? sheetCopy.editTitle : sheetCopy.createTitle}
              </h1>
              <p>
                {isEdit
                  ? sheetCopy.editDescription
                  : sheetCopy.createDescription}
              </p>
            </header>

            {emptyState ? (
              <section className={sheetStyles.emptyState}>
                <span aria-hidden="true">⌘</span>
                <h2>{emptyState.title}</h2>
                <p>{emptyState.description}</p>
                <Link
                  className={sheetStyles.addCharacterButton}
                  href={`/works/${work.id}/characters/new`}
                >
                  {listCopy.addCharacter}
                </Link>
              </section>
            ) : (
              <>
                <RelationForm
                  form={form}
                  characters={characters}
                  copy={sheetCopy}
                  fieldErrors={fieldErrors}
                  saveError={saveError}
                  saveStatus={
                    isEdit
                      ? isSaving
                        ? sheetCopy.saving
                        : isDirty
                          ? sheetCopy.unsaved
                          : sheetCopy.saved
                      : undefined
                  }
                  isSaving={isSaving}
                  submitDisabled={isEdit && (!isDirty || isDeleting)}
                  submitLabel={
                    isSaving
                      ? sheetCopy.saving
                      : isEdit
                        ? sheetCopy.submitEdit
                        : sheetCopy.submitCreate
                  }
                  onChange={handleFieldChange}
                  onSubmit={(event) => void handleSubmit(event)}
                />

                {isEdit ? (
                  <div className={sheetStyles.dangerZone}>
                    <button
                      type="button"
                      disabled={isSaving || isDeleting}
                      onClick={() => void handleDelete()}
                    >
                      {isDeleting ? sheetCopy.deleting : sheetCopy.delete}
                    </button>
                    {deleteError ? (
                      <p className={sheetStyles.deleteError}>{deleteError}</p>
                    ) : null}
                  </div>
                ) : null}
              </>
            )}
          </main>
        )}
      </div>
    </div>
  );
}
