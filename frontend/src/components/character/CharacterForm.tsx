import { useState, type FormEvent, type ReactNode } from "react";
import type { Messages } from "@/i18n/messages";
import {
  CHARACTER_FIELD_LIMITS,
  CHARACTER_PROFILE_LIMITS,
  type CharacterFormState,
  type CharacterProfile,
} from "@/types/character";
import styles from "@/app/works/[workId]/characters/character-sheet.module.css";

type CharacterSheetCopy = Messages["workspace"]["characterSheet"];

interface CharacterFormProps {
  form: CharacterFormState;
  copy: CharacterSheetCopy;
  fieldErrors: Partial<Record<keyof CharacterFormState, string>>;
  saveError: string;
  saveStatus?: string;
  isSaving: boolean;
  submitDisabled?: boolean;
  submitLabel: string;
  showProfile?: boolean;
  showCustomFields?: boolean;
  labelErrors?: string[];
  onChange: (
    field: Exclude<keyof CharacterFormState, "profile" | "customFields">,
    value: string,
  ) => void;
  onProfileChange: (field: keyof CharacterProfile, value: string) => void;
  onCustomFieldChange: (
    clientKey: string,
    field: "label" | "value",
    value: string,
  ) => void;
  onAddCustomField: () => void;
  onMoveCustomField: (index: number, direction: -1 | 1) => void;
  onDeleteCustomField: (clientKey: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

function FoldSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className={styles.section}>
      <button
        className={styles.foldHeader}
        type="button"
        aria-expanded={open}
        onClick={onToggle}
      >
        <h2>{title}</h2>
        <span aria-hidden="true">{open ? "∧" : "∨"}</span>
      </button>
      {open ? <div className={styles.foldBody}>{children}</div> : null}
    </section>
  );
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
  showProfile = false,
  showCustomFields = false,
  labelErrors = [],
  onChange,
  onProfileChange,
  onCustomFieldChange,
  onAddCustomField,
  onMoveCustomField,
  onDeleteCustomField,
  onSubmit,
}: CharacterFormProps) {
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [personalityOpen, setPersonalityOpen] = useState(false);
  const [customFieldsOpen, setCustomFieldsOpen] = useState(false);

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

      {showProfile ? (
        <>
          <FoldSection
            title={copy.appearance}
            open={appearanceOpen}
            onToggle={() => setAppearanceOpen((current) => !current)}
          >
            <div className={styles.fieldGrid}>
              <label className={styles.field}>
                <span>{copy.height}</span>
                <input
                  type="text"
                  maxLength={CHARACTER_PROFILE_LIMITS.height}
                  value={form.profile.height}
                  placeholder={copy.heightPlaceholder}
                  onChange={(event) =>
                    onProfileChange("height", event.target.value)
                  }
                />
              </label>
              <label className={styles.field}>
                <span>{copy.bodyType}</span>
                <input
                  type="text"
                  maxLength={CHARACTER_PROFILE_LIMITS.bodyType}
                  value={form.profile.bodyType}
                  placeholder={copy.bodyTypePlaceholder}
                  onChange={(event) =>
                    onProfileChange("bodyType", event.target.value)
                  }
                />
              </label>
              <label className={styles.field}>
                <span>{copy.hair}</span>
                <input
                  type="text"
                  maxLength={CHARACTER_PROFILE_LIMITS.hair}
                  value={form.profile.hair}
                  placeholder={copy.hairPlaceholder}
                  onChange={(event) =>
                    onProfileChange("hair", event.target.value)
                  }
                />
              </label>
              <label className={styles.field}>
                <span>{copy.eyes}</span>
                <input
                  type="text"
                  maxLength={CHARACTER_PROFILE_LIMITS.eyes}
                  value={form.profile.eyes}
                  placeholder={copy.eyesPlaceholder}
                  onChange={(event) =>
                    onProfileChange("eyes", event.target.value)
                  }
                />
              </label>
              <label className={styles.field}>
                <span>{copy.skin}</span>
                <input
                  type="text"
                  maxLength={CHARACTER_PROFILE_LIMITS.skin}
                  value={form.profile.skin}
                  placeholder={copy.skinPlaceholder}
                  onChange={(event) =>
                    onProfileChange("skin", event.target.value)
                  }
                />
              </label>
              <label className={styles.field}>
                <span>{copy.fashion}</span>
                <input
                  type="text"
                  maxLength={CHARACTER_PROFILE_LIMITS.fashion}
                  value={form.profile.fashion}
                  placeholder={copy.fashionPlaceholder}
                  onChange={(event) =>
                    onProfileChange("fashion", event.target.value)
                  }
                />
              </label>
            </div>
            <label className={styles.field}>
              <span>{copy.feature}</span>
              <input
                type="text"
                maxLength={CHARACTER_PROFILE_LIMITS.feature}
                value={form.profile.feature}
                placeholder={copy.featurePlaceholder}
                onChange={(event) =>
                  onProfileChange("feature", event.target.value)
                }
              />
            </label>
            <label className={styles.field}>
              <span>{copy.appearanceNote}</span>
              <textarea
                rows={4}
                value={form.profile.appearanceNote}
                placeholder={copy.appearanceNotePlaceholder}
                onChange={(event) =>
                  onProfileChange("appearanceNote", event.target.value)
                }
              />
            </label>
          </FoldSection>

          <FoldSection
            title={copy.personalityHabits}
            open={personalityOpen}
            onToggle={() => setPersonalityOpen((current) => !current)}
          >
            <label className={styles.field}>
              <span>{copy.personality}</span>
              <textarea
                rows={4}
                value={form.profile.personality}
                placeholder={copy.personalityPlaceholder}
                onChange={(event) =>
                  onProfileChange("personality", event.target.value)
                }
              />
            </label>
            <label className={styles.field}>
              <span>{copy.likes}</span>
              <textarea
                rows={3}
                value={form.profile.likes}
                placeholder={copy.likesPlaceholder}
                onChange={(event) =>
                  onProfileChange("likes", event.target.value)
                }
              />
            </label>
            <label className={styles.field}>
              <span>{copy.dislikes}</span>
              <textarea
                rows={3}
                value={form.profile.dislikes}
                placeholder={copy.dislikesPlaceholder}
                onChange={(event) =>
                  onProfileChange("dislikes", event.target.value)
                }
              />
            </label>
            <label className={styles.field}>
              <span>{copy.secret}</span>
              <textarea
                rows={4}
                value={form.profile.secret}
                placeholder={copy.secretPlaceholder}
                onChange={(event) =>
                  onProfileChange("secret", event.target.value)
                }
              />
            </label>
            <label className={styles.field}>
              <span>{copy.habits}</span>
              <textarea
                rows={4}
                value={form.profile.habits}
                placeholder={copy.habitsPlaceholder}
                onChange={(event) =>
                  onProfileChange("habits", event.target.value)
                }
              />
            </label>
            <label className={styles.field}>
              <span>{copy.speechMannerism}</span>
              <textarea
                rows={3}
                value={form.profile.speechMannerism}
                placeholder={copy.speechMannerismPlaceholder}
                onChange={(event) =>
                  onProfileChange("speechMannerism", event.target.value)
                }
              />
            </label>
            <label className={styles.field}>
              <span>{copy.signature}</span>
              <textarea
                rows={3}
                value={form.profile.signature}
                placeholder={copy.signaturePlaceholder}
                onChange={(event) =>
                  onProfileChange("signature", event.target.value)
                }
              />
            </label>
          </FoldSection>
        </>
      ) : null}

      {showCustomFields ? (
        <FoldSection
          title={copy.customTitle}
          open={customFieldsOpen}
          onToggle={() => setCustomFieldsOpen((current) => !current)}
        >
          <p className={styles.customDescription}>{copy.customDescription}</p>
          {form.customFields.length === 0 ? (
            <p className={styles.customEmpty}>{copy.customEmpty}</p>
          ) : (
            <ul className={styles.customList}>
              {form.customFields.map((field, index) => {
                const hasLabelError = labelErrors.includes(field.clientKey);

                return (
                  <li className={styles.customItem} key={field.clientKey}>
                    <label className={styles.field}>
                      <span>{copy.fieldLabel}</span>
                      <input
                        type="text"
                        maxLength={100}
                        value={field.label}
                        placeholder={copy.fieldLabelPlaceholder}
                        aria-invalid={hasLabelError}
                        onChange={(event) =>
                          onCustomFieldChange(
                            field.clientKey,
                            "label",
                            event.target.value,
                          )
                        }
                      />
                    </label>
                    {hasLabelError ? (
                      <p className={styles.fieldError}>{copy.labelRequired}</p>
                    ) : null}
                    <label className={styles.field}>
                      <span>{copy.fieldValue}</span>
                      <textarea
                        rows={3}
                        value={field.value}
                        placeholder={copy.fieldValuePlaceholder}
                        onChange={(event) =>
                          onCustomFieldChange(
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
                        aria-label={copy.moveUp}
                        onClick={() => onMoveCustomField(index, -1)}
                      >
                        {copy.moveUp}
                      </button>
                      <button
                        type="button"
                        disabled={index === form.customFields.length - 1}
                        aria-label={copy.moveDown}
                        onClick={() => onMoveCustomField(index, 1)}
                      >
                        {copy.moveDown}
                      </button>
                      <button
                        type="button"
                        aria-label={copy.deleteField}
                        onClick={() => onDeleteCustomField(field.clientKey)}
                      >
                        {copy.deleteField}
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
            onClick={onAddCustomField}
          >
            {copy.addField}
          </button>
        </FoldSection>
      ) : null}

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
