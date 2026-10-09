"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { Messages } from "@/i18n/messages";
import type { CreateWorkInput } from "@/types/work";
import styles from "@/app/page.module.css";

interface NewWorkModalProps {
  copy: Messages["modal"];
  // 취소하거나 등록을 마친 뒤 부모 컴포넌트에 모달 닫기를 요청합니다.
  onClose: () => void;
  // 입력한 작품 정보를 부모의 API 등록 로직으로 전달합니다.
  onCreate: (input: CreateWorkInput) => Promise<void>;
}

export default function NewWorkModal({
  copy,
  onClose,
  onCreate,
}: NewWorkModalProps) {
  // 폼에 입력된 작품 제목과 선택 부제를 관리합니다.
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  // 유효성 검사 또는 등록 실패 메시지를 표시합니다.
  const [error, setError] = useState("");
  // 중복 등록과 제출 중 모달 닫기를 막기 위한 상태입니다.
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 모달이 열리거나 제목이 비어 있을 때 제목 입력란으로 포커스를 옮깁니다.
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

  // 제목을 검증한 뒤 정리된 입력값으로 작품 등록을 요청합니다.
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
      await onCreate({
        title: trimmedTitle,
        subtitle: subtitle.trim() || undefined,
      });
      onClose();
    } catch {
      setError(copy.createError);
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
        aria-labelledby="new-work-title"
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
          <h2 id="new-work-title">{copy.title}</h2>
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
              placeholder={copy.titlePlaceholder}
              maxLength={200}
              disabled={isSubmitting}
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
              placeholder={copy.subtitlePlaceholder}
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
              disabled={isSubmitting}
            >
              {isSubmitting ? copy.submitting : copy.submit}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
