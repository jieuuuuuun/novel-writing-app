import type { FormEvent } from "react";
import type { Messages } from "@/i18n/messages";
import {
  CHARACTER_FIELD_LIMITS,
  type CharacterFormState,
} from "@/types/character";
import styles from "@/app/works/[workId]/characters/character-sheet.module.css";

interface CharacterFormProps {
  form: CharacterFormState;
  copy: Messages["workspace"]["characterSheet"];
  fieldErrors: Partial<Record<keyof CharacterFormState, string>>;
  saveError: string;
  saveStatus?: string;
  isSaving: boolean;
  submitDisabled?: boolean;
  submitLabel: string;
  onChange: (field: keyof CharacterFormState, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export default function CharacterForm({
  form,
  copy,
  fieldErrors,
  saveError,
  saveStatus,
  isSaving,
  submitDisabled = false,
  submitLabel,
  onChange,
  onSubmit,
}: CharacterFormProps) {
  return (
    <form className={styles.sheetForm} onSubmit={onSubmit}>
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2>{copy.basics}</h2>
        </header>

        <label className={styles.field}>
          <span>{copy.name}</span>
          <input
            type="text"
            maxLength={CHARACTER_FIELD_LIMITS.name}
            value={form.name}
            placeholder={copy.namePlaceholder}
            aria-invalid={Boolean(fieldErrors.name)}
            onChange={(event) => onChange("name", event.target.value)}
          />
          {fieldErrors.name ? (
            <p className={styles.fieldError}>{fieldErrors.name}</p>
          ) : null}
        </label>

        <label className={styles.field}>
          <span>{copy.role}</span>
          <input
            type="text"
            maxLength={CHARACTER_FIELD_LIMITS.role}
            value={form.role}
            placeholder={copy.rolePlaceholder}
            onChange={(event) => onChange("role", event.target.value)}
          />
          {fieldErrors.role ? (
            <p className={styles.fieldError}>{fieldErrors.role}</p>
          ) : null}
        </label>

        <label className={styles.field}>
          <span>{copy.age}</span>
          <input
            type="text"
            maxLength={CHARACTER_FIELD_LIMITS.age}
            value={form.age}
            placeholder={copy.agePlaceholder}
            onChange={(event) => onChange("age", event.target.value)}
          />
          {fieldErrors.age ? (
            <p className={styles.fieldError}>{fieldErrors.age}</p>
          ) : null}
        </label>

        <label className={styles.field}>
          <span>{copy.occupation}</span>
          <input
            type="text"
            maxLength={CHARACTER_FIELD_LIMITS.occupation}
            value={form.occupation}
            placeholder={copy.occupationPlaceholder}
            onChange={(event) => onChange("occupation", event.target.value)}
          />
          {fieldErrors.occupation ? (
            <p className={styles.fieldError}>{fieldErrors.occupation}</p>
          ) : null}
        </label>

        <label className={styles.field}>
          <span>{copy.summary}</span>
          <textarea
            className={styles.short}
            rows={2}
            maxLength={CHARACTER_FIELD_LIMITS.summary}
            value={form.summary}
            placeholder={copy.summaryPlaceholder}
            onChange={(event) => onChange("summary", event.target.value)}
          />
          {fieldErrors.summary ? (
            <p className={styles.fieldError}>{fieldErrors.summary}</p>
          ) : null}
        </label>
      </section>

      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2>{copy.inner}</h2>
        </header>

        <label className={styles.field}>
          <span>{copy.goal}</span>
          <textarea
            rows={4}
            value={form.goal}
            placeholder={copy.goalPlaceholder}
            onChange={(event) => onChange("goal", event.target.value)}
          />
        </label>

        <label className={styles.field}>
          <span>{copy.trauma}</span>
          <textarea
            rows={4}
            value={form.trauma}
            placeholder={copy.traumaPlaceholder}
            onChange={(event) => onChange("trauma", event.target.value)}
          />
        </label>

        <label className={styles.field}>
          <span>{copy.weakness}</span>
          <textarea
            rows={4}
            value={form.weakness}
            placeholder={copy.weaknessPlaceholder}
            onChange={(event) => onChange("weakness", event.target.value)}
          />
        </label>

        <label className={styles.field}>
          <span>{copy.lack}</span>
          <textarea
            rows={4}
            value={form.lack}
            placeholder={copy.lackPlaceholder}
            onChange={(event) => onChange("lack", event.target.value)}
          />
        </label>

        <label className={styles.field}>
          <span>{copy.quote}</span>
          <textarea
            rows={3}
            value={form.quote}
            placeholder={copy.quotePlaceholder}
            onChange={(event) => onChange("quote", event.target.value)}
          />
        </label>
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
