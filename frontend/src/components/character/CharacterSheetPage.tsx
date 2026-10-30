"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import UserMenu from "@/components/auth/UserMenu";
import WorkSearch from "@/components/work/WorkSearch";
import WorkspaceSidebar from "@/components/workspace/WorkspaceSidebar";
import { defaultLocale, getMessages, type Messages } from "@/i18n/messages";
import {
  createCharacter,
  deleteCharacter,
  getCharacter,
  updateCharacter,
} from "@/lib/character-api";
import { getWork, getWorks } from "@/lib/work-api";
import {
  CHARACTER_FIELD_LIMITS,
  emptyCharacterForm,
  emptyCharacterProfile,
  type CharacterCustomField,
  type CharacterCustomFieldDraft,
  type CharacterDetail,
  type CharacterFormState,
  type CharacterProfile,
  type CreateCharacterInput,
  type UpdateCharacterInput,
} from "@/types/character";
import type { Work } from "@/types/work";
import CharacterForm from "./CharacterForm";
import sheetStyles from "@/app/works/[workId]/characters/character-sheet.module.css";
import workspaceStyles from "@/app/works/[workId]/workspace.module.css";

interface CharacterSheetPageProps {
  workId: string;
  characterId?: string;
  mode?: "create" | "edit";
}

type CharacterSheetCopy = Messages["workspace"]["characterSheet"];
type CharacterFieldErrors = Partial<Record<keyof CharacterFormState, string>>;

function toProfileState(
  profile?: Partial<CharacterProfile> | null,
): CharacterProfile {
  return {
    ...emptyCharacterProfile,
    ...profile,
  };
}

function normalizeCustomFields(
  fields: CharacterCustomFieldDraft[],
): CharacterCustomFieldDraft[] {
  return fields.map((field, index) => ({
    ...field,
    sortOrder: index,
  }));
}

function toDraftCustomFields(
  fields: CharacterCustomField[],
): CharacterCustomFieldDraft[] {
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
  current: CharacterCustomFieldDraft[],
  saved: CharacterCustomFieldDraft[],
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

function toCharacterFormState(character: CharacterDetail): CharacterFormState {
  return {
    name: character.name,
    role: character.role,
    age: character.age,
    occupation: character.occupation,
    summary: character.summary,
    goal: character.goal,
    trauma: character.trauma,
    weakness: character.weakness,
    lack: character.lack,
    quote: character.quote,
    profile: toProfileState(character.profile),
    customFields: toDraftCustomFields(character.customFields ?? []),
  };
}

function isSameCharacterForm(
  left: CharacterFormState,
  right: CharacterFormState,
) {
  const baseFields = Object.keys(emptyCharacterForm).filter(
    (field) => field !== "profile" && field !== "customFields",
  ) as Array<Exclude<keyof CharacterFormState, "profile" | "customFields">>;
  const profileFields = Object.keys(emptyCharacterProfile) as Array<
    keyof CharacterProfile
  >;

  return (
    baseFields.every((field) => left[field] === right[field]) &&
    profileFields.every(
      (field) => left.profile[field] === right.profile[field],
    ) &&
    areCustomFieldsEqual(left.customFields, right.customFields)
  );
}

function toCreatePayload(form: CharacterFormState): CreateCharacterInput {
  return {
    name: form.name.trim(),
    role: form.role.trim(),
    age: form.age.trim(),
    occupation: form.occupation.trim(),
    summary: form.summary.trim(),
    goal: form.goal,
    trauma: form.trauma,
    weakness: form.weakness,
    lack: form.lack,
    quote: form.quote,
  };
}

function toUpdatePayload(form: CharacterFormState): UpdateCharacterInput {
  const profile = form.profile;
  const customFields = normalizeCustomFields(form.customFields);

  return {
    ...toCreatePayload(form),
    profile: {
      height: profile.height.trim(),
      bodyType: profile.bodyType.trim(),
      hair: profile.hair.trim(),
      eyes: profile.eyes.trim(),
      skin: profile.skin.trim(),
      fashion: profile.fashion.trim(),
      feature: profile.feature.trim(),
      appearanceNote: profile.appearanceNote,
      personality: profile.personality,
      likes: profile.likes,
      dislikes: profile.dislikes,
      secret: profile.secret,
      habits: profile.habits,
      speechMannerism: profile.speechMannerism,
      signature: profile.signature,
    },
    customFields: customFields.map((field) => ({
      ...(field.id != null ? { id: field.id } : {}),
      label: field.label.trim(),
      value: field.value,
      sortOrder: field.sortOrder,
    })),
  };
}

function validateCharacterForm(
  form: CharacterFormState,
  copy: CharacterSheetCopy,
): CharacterFieldErrors {
  const errors: CharacterFieldErrors = {};
  const name = form.name.trim();

  if (!name) {
    errors.name = copy.nameRequired;
  } else if (name.length > CHARACTER_FIELD_LIMITS.name) {
    errors.name = copy.tooLong(CHARACTER_FIELD_LIMITS.name);
  }

  if (form.role.trim().length > CHARACTER_FIELD_LIMITS.role) {
    errors.role = copy.tooLong(CHARACTER_FIELD_LIMITS.role);
  }

  if (form.age.trim().length > CHARACTER_FIELD_LIMITS.age) {
    errors.age = copy.tooLong(CHARACTER_FIELD_LIMITS.age);
  }

  if (form.occupation.trim().length > CHARACTER_FIELD_LIMITS.occupation) {
    errors.occupation = copy.tooLong(CHARACTER_FIELD_LIMITS.occupation);
  }

  if (form.summary.trim().length > CHARACTER_FIELD_LIMITS.summary) {
    errors.summary = copy.tooLong(CHARACTER_FIELD_LIMITS.summary);
  }

  return errors;
}

export default function CharacterSheetPage({
  workId,
  characterId,
  mode = "create",
}: CharacterSheetPageProps) {
  const locale = defaultLocale;
  const copy = getMessages(locale);
  const router = useRouter();
  const numericWorkId = Number(workId);
  const numericCharacterId = Number(characterId);
  const isValidWorkId = Number.isInteger(numericWorkId) && numericWorkId > 0;
  const isValidCharacterId =
    Number.isInteger(numericCharacterId) && numericCharacterId > 0;
  const isValidRoute =
    isValidWorkId && (mode === "create" || isValidCharacterId);
  const isEdit = mode === "edit";
  const listHref = `/works/${numericWorkId}/characters`;
  const sheetCopy = copy.workspace.characterSheet;
  const nextFieldKey = useRef(0);

  const [work, setWork] = useState<Work | null>(null);
  const [character, setCharacter] = useState<CharacterDetail | null>(null);
  const [allWorks, setAllWorks] = useState<Work[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState<CharacterFormState>(emptyCharacterForm);
  const [savedForm, setSavedForm] = useState<CharacterFormState>(
    emptyCharacterForm,
  );
  const [fieldErrors, setFieldErrors] = useState<CharacterFieldErrors>({});
  const [isLoading, setIsLoading] = useState(isValidRoute);
  const [loadError, setLoadError] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [labelErrors, setLabelErrors] = useState<string[]>([]);

  const isDirty = !isSameCharacterForm(form, savedForm);
  const hasSheetData = work !== null && (!isEdit || character !== null);

  const applyCharacter = (nextCharacter: CharacterDetail) => {
    const nextForm = toCharacterFormState(nextCharacter);
    setCharacter(nextCharacter);
    setForm(nextForm);
    setSavedForm(nextForm);
    setFieldErrors({});
    setLabelErrors([]);
  };

  const loadPage = async () => {
    if (!isValidRoute) return;

    try {
      const [workData, characterData, workListData] = await Promise.all([
        getWork(numericWorkId),
        isEdit
          ? getCharacter(numericWorkId, numericCharacterId)
          : Promise.resolve(null),
        getWorks().catch(() => []),
      ]);
      setWork(workData);
      setAllWorks(workListData);
      if (isEdit && characterData) {
        applyCharacter(characterData);
      } else {
        setCharacter(null);
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
      isEdit
        ? getCharacter(numericWorkId, numericCharacterId, controller.signal)
        : Promise.resolve(null),
      getWorks(controller.signal).catch(() => []),
    ])
      .then(([workData, characterData, workListData]) => {
        setWork(workData);
        setAllWorks(workListData);
        if (isEdit && characterData) {
          applyCharacter(characterData);
        } else {
          setCharacter(null);
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
  }, [isEdit, isValidRoute, numericCharacterId, numericWorkId]);

  const statusMessage = loadError
    ? copy.workspace.states.error
    : copy.workspace.states.notFound;

  const handleFieldChange = (
    field: Exclude<keyof CharacterFormState, "profile" | "customFields">,
    value: string,
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setSaveError("");
  };

  const handleProfileChange = (
    field: keyof CharacterProfile,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      profile: {
        ...current.profile,
        [field]: value,
      },
    }));
    setSaveError("");
  };

  const handleCustomFieldChange = (
    clientKey: string,
    field: "label" | "value",
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      customFields: current.customFields.map((item) =>
        item.clientKey === clientKey ? { ...item, [field]: value } : item,
      ),
    }));
    setSaveError("");
    if (field === "label") {
      setLabelErrors((current) =>
        current.filter((key) => key !== clientKey),
      );
    }
  };

  const handleAddCustomField = () => {
    nextFieldKey.current += 1;
    setForm((current) => ({
      ...current,
      customFields: normalizeCustomFields([
        ...current.customFields,
        {
          clientKey: `new-${nextFieldKey.current}`,
          label: "",
          value: "",
          sortOrder: current.customFields.length,
        },
      ]),
    }));
    setSaveError("");
  };

  const handleMoveCustomField = (index: number, direction: -1 | 1) => {
    setForm((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.customFields.length) {
        return current;
      }

      const next = [...current.customFields];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);

      return {
        ...current,
        customFields: normalizeCustomFields(next),
      };
    });
    setSaveError("");
  };

  const handleDeleteCustomField = (clientKey: string) => {
    const target = form.customFields.find(
      (field) => field.clientKey === clientKey,
    );
    if (!target) return;
    if (target.id != null && !window.confirm(sheetCopy.deleteCustomConfirm)) {
      return;
    }

    setForm((current) => ({
      ...current,
      customFields: normalizeCustomFields(
        current.customFields.filter((field) => field.clientKey !== clientKey),
      ),
    }));
    setLabelErrors((current) => current.filter((key) => key !== clientKey));
    setSaveError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValidRoute || isSaving || isDeleting) return;
    if (isEdit && !isDirty) return;

    const errors = validateCharacterForm(form, sheetCopy);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const blankLabels = form.customFields
      .filter((field) => !field.label.trim())
      .map((field) => field.clientKey);

    if (blankLabels.length > 0) {
      setLabelErrors(blankLabels);
      return;
    }

    setIsSaving(true);
    setSaveError("");

    try {
      if (isEdit) {
        const updatedCharacter = await updateCharacter(
          numericWorkId,
          numericCharacterId,
          toUpdatePayload(form),
        );
        applyCharacter(updatedCharacter);
        setIsSaving(false);
        return;
      }

      await createCharacter(numericWorkId, toCreatePayload(form));
      router.replace(listHref);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "";
      setSaveError(
        isEdit && message.includes("Invalid custom field")
          ? sheetCopy.customFieldInvalid
          : isEdit
            ? sheetCopy.updateError
            : sheetCopy.saveError,
      );
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit || !isValidCharacterId || isSaving || isDeleting) return;
    if (!window.confirm(sheetCopy.deleteConfirm)) return;

    setIsDeleting(true);
    setDeleteError("");

    try {
      await deleteCharacter(numericWorkId, numericCharacterId);
      router.replace(listHref);
    } catch {
      setDeleteError(sheetCopy.deleteError);
      setIsDeleting(false);
    }
  };

  return (
    <div className={workspaceStyles.workspaceShell}>
      <WorkspaceSidebar
        copy={copy.workspace}
        brand={copy.brand}
        workId={numericWorkId}
        activeMenu="characters"
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
              activeMenu="characters"
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

            <CharacterForm
              form={form}
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
              showProfile={isEdit}
              showCustomFields={isEdit}
              labelErrors={labelErrors}
              onChange={handleFieldChange}
              onProfileChange={handleProfileChange}
              onCustomFieldChange={handleCustomFieldChange}
              onAddCustomField={handleAddCustomField}
              onMoveCustomField={handleMoveCustomField}
              onDeleteCustomField={handleDeleteCustomField}
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
          </main>
        )}
      </div>
    </div>
  );
}
