import type { FormEvent } from "react";
import type { Messages } from "@/i18n/messages";
import type { Character } from "@/types/character";
import {
  RELATION_FIELD_LIMITS,
  type RelationFormState,
} from "@/types/relation";
import styles from "@/app/works/[workId]/relations/relation-sheet.module.css";

type RelationSheetCopy = Messages["workspace"]["relationSheet"];
type RelationFieldErrors = Partial<
  Record<keyof RelationFormState | "pair", string>
>;

interface RelationFormProps {
  form: RelationFormState;
  characters: Character[];
  copy: RelationSheetCopy;
  fieldErrors: RelationFieldErrors;
  saveError: string;
  saveStatus?: string;
  isSaving: boolean;
  submitDisabled?: boolean;
  submitLabel: string;
  onChange: (field: keyof RelationFormState, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

function characterLabel(character: Character) {
  return character.role
    ? `${character.name} · ${character.role}`
    : character.name;
}

function CharacterSelect({
  id,
  label,
  value,
  excludedId,
  characters,
  placeholder,
  invalid,
  error,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  excludedId: string;
  characters: Character[];
  placeholder: string;
  invalid: boolean;
  error?: string;
  onChange: (value: string) => void;
}) {
  const options = characters.filter(
    (character) => String(character.id) !== excludedId,
  );

  return (
    <label className={styles.field} htmlFor={id}>
      <span>{label}</span>
      <select
        id={id}
        value={value}
        aria-invalid={invalid}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((character) => (
          <option key={character.id} value={String(character.id)}>
            {characterLabel(character)}
          </option>
        ))}
      </select>
      {error ? <p className={styles.fieldError}>{error}</p> : null}
    </label>
  );
}

export default function RelationForm({
  form,
  characters,
  copy,
  fieldErrors,
  saveError,
  saveStatus,
  isSaving,
  submitDisabled = false,
  submitLabel,
  onChange,
  onSubmit,
}: RelationFormProps) {
  const firstCharacter = characters.find(
    (character) => String(character.id) === form.characterAId,
  );
  const secondCharacter = characters.find(
    (character) => String(character.id) === form.characterBId,
  );
  const fromName = firstCharacter?.name ?? copy.firstCharacter;
  const toName = secondCharacter?.name ?? copy.secondCharacter;

  return (
    <form className={styles.sheetForm} onSubmit={onSubmit}>
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2>{copy.people}</h2>
        </header>

        <CharacterSelect
          id="relation-character-a"
          label={copy.firstCharacter}
          value={form.characterAId}
          excludedId={form.characterBId}
          characters={characters}
          placeholder={copy.characterPlaceholder}
          invalid={Boolean(fieldErrors.pair || fieldErrors.characterAId)}
          error={fieldErrors.characterAId}
          onChange={(value) => onChange("characterAId", value)}
        />

        <CharacterSelect
          id="relation-character-b"
          label={copy.secondCharacter}
          value={form.characterBId}
          excludedId={form.characterAId}
          characters={characters}
          placeholder={copy.characterPlaceholder}
          invalid={Boolean(fieldErrors.pair || fieldErrors.characterBId)}
          error={fieldErrors.characterBId}
          onChange={(value) => onChange("characterBId", value)}
        />
        {fieldErrors.pair ? (
          <p className={styles.fieldError}>{fieldErrors.pair}</p>
        ) : null}
      </section>

      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2>{copy.bond}</h2>
        </header>

        <label className={styles.field} htmlFor="relation-type">
          <span>{copy.type}</span>
          <input
            id="relation-type"
            type="text"
            list="relation-type-suggestions"
            maxLength={RELATION_FIELD_LIMITS.type}
            value={form.type}
            placeholder={copy.typePlaceholder}
            aria-invalid={Boolean(fieldErrors.type)}
            onChange={(event) => onChange("type", event.target.value)}
          />
          <datalist id="relation-type-suggestions">
            {copy.typeSuggestions.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>
          {fieldErrors.type ? (
            <p className={styles.fieldError}>{fieldErrors.type}</p>
          ) : null}
        </label>

        <label className={styles.field} htmlFor="relation-summary">
          <span>{copy.summary}</span>
          <textarea
            id="relation-summary"
            className={styles.short}
            rows={2}
            maxLength={RELATION_FIELD_LIMITS.summary}
            value={form.summary}
            placeholder={copy.summaryPlaceholder}
            aria-invalid={Boolean(fieldErrors.summary)}
            onChange={(event) => onChange("summary", event.target.value)}
          />
          {fieldErrors.summary ? (
            <p className={styles.fieldError}>{fieldErrors.summary}</p>
          ) : null}
        </label>
      </section>

      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2>{copy.feelings}</h2>
        </header>

        <div className={styles.directionBlock}>
          <h3>{copy.directionTitle(fromName, toName)}</h3>
          <label className={styles.field} htmlFor="relation-a-to-b-label">
            <span>{copy.feeling}</span>
            <input
              id="relation-a-to-b-label"
              type="text"
              maxLength={RELATION_FIELD_LIMITS.label}
              value={form.aToBLabel}
              placeholder={copy.feelingPlaceholder}
              aria-invalid={Boolean(fieldErrors.aToBLabel)}
              onChange={(event) => onChange("aToBLabel", event.target.value)}
            />
            {fieldErrors.aToBLabel ? (
              <p className={styles.fieldError}>{fieldErrors.aToBLabel}</p>
            ) : null}
          </label>
          <label className={styles.field} htmlFor="relation-a-to-b-note">
            <span>{copy.note}</span>
            <textarea
              id="relation-a-to-b-note"
              rows={4}
              value={form.aToBNote}
              placeholder={copy.notePlaceholder}
              onChange={(event) => onChange("aToBNote", event.target.value)}
            />
          </label>
        </div>

        <div className={styles.directionBlock}>
          <h3>{copy.directionTitle(toName, fromName)}</h3>
          <label className={styles.field} htmlFor="relation-b-to-a-label">
            <span>{copy.feeling}</span>
            <input
              id="relation-b-to-a-label"
              type="text"
              maxLength={RELATION_FIELD_LIMITS.label}
              value={form.bToALabel}
              placeholder={copy.feelingPlaceholder}
              aria-invalid={Boolean(fieldErrors.bToALabel)}
              onChange={(event) => onChange("bToALabel", event.target.value)}
            />
            {fieldErrors.bToALabel ? (
              <p className={styles.fieldError}>{fieldErrors.bToALabel}</p>
            ) : null}
          </label>
          <label className={styles.field} htmlFor="relation-b-to-a-note">
            <span>{copy.note}</span>
            <textarea
              id="relation-b-to-a-note"
              rows={4}
              value={form.bToANote}
              placeholder={copy.notePlaceholder}
              onChange={(event) => onChange("bToANote", event.target.value)}
            />
          </label>
        </div>
      </section>

      <div className={styles.saveBar}>
        {saveStatus ? <span>{saveStatus}</span> : null}
        <button type="submit" disabled={isSaving || submitDisabled}>
          {submitLabel}
        </button>
      </div>
      {saveError ? <p className={styles.saveError}>{saveError}</p> : null}
    </form>
  );
}
