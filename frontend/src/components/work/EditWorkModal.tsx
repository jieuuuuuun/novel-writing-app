"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { Messages } from "@/i18n/messages";
import type { UpdateWorkInput, Work } from "@/types/work";
import styles from "@/app/page.module.css";

interface EditWorkModalProps {
  copy: Messages["workEdit"];
  work: Work;
  onClose: () => void;
  onUpdate: (
    workId: number,
    input: UpdateWorkInput,
  ) => Promise<void>;
}

export default function EditWorkModal({
  copy,
  work,
  onClose,
  onUpdate,
}: EditWorkModalProps) {
  // 현재 작품 정보를 초기값으로 사용해 수정 중인 입력값을 관리합니다.
  const [title, setTitle] = useState(work.title);
  const [subtitle, setSubtitle] = useState(work.subtitle ?? "");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // 모달이 열린 동안 배경 스크롤을 막고 Escape 키 닫기를 지원합니다.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    titleInputRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSubmitting, onClose]);

  // 제목을 검증한 뒤 현재 작품 ID와 수정할 메타정보를 부모에 전달합니다.
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError(copy.titleRequired);
      titleInputRef.current?.focus();
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await onUpdate(work.id, {
        title: trimmedTitle,
        subtitle: subtitle.trim(),
      });
      onClose();
    } catch {
      setError(copy.updateError);
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={styles.modalBackdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-work-title"
      >
        <button
          className={styles.modalClose}
          type="button"
          aria-label={copy.close}
          onClick={onClose}
          disabled={isSubmitting}
        >
          <span aria-hidden="true">×</span>
        </button>

        <div className={styles.modalHeading}>
          <span className={styles.modalEyebrow}>{copy.eyebrow}</span>
          <h2 id="edit-work-title">{copy.title}</h2>
          <p>{copy.description}</p>
        </div>

        <form className={styles.workForm} onSubmit={handleSubmit}>
          <label className={styles.formField}>
            <span>{copy.workTitle}</span>
            <input
              ref={titleInputRef}
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                if (error) setError("");
              }}
              maxLength={200}
              disabled={isSubmitting}
              required
            />
            <small>{title.length}/200</small>
          </label>

          <label className={styles.formField}>
            <span>
              {copy.subtitle}
              <em>{copy.optional}</em>
            </span>
            <textarea
              value={subtitle}
              onChange={(event) => setSubtitle(event.target.value)}
              maxLength={500}
              rows={3}
              disabled={isSubmitting}
            />
            <small>{subtitle.length}/500</small>
          </label>

          {error ? (
            <p className={styles.formError} role="alert">
              {error}
            </p>
          ) : null}

          <div className={styles.modalActions}>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {copy.cancel}
            </button>
            <button
              className={styles.primaryButton}
              type="submit"
              disabled={isSubmitting || !title.trim()}
            >
              {isSubmitting ? copy.saving : copy.save}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
