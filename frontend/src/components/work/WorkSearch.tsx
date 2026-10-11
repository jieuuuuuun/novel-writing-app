"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { Locale } from "@/i18n/messages";
import type { Work } from "@/types/work";
import styles from "./WorkSearch.module.css";

interface WorkSearchProps {
  works: Work[];
  locale: Locale;
  value: string;
  placeholder: string;
  noResults: string;
  onChange: (value: string) => void;
  showResults?: boolean;
  currentWorkId?: number;
}

export default function WorkSearch({
  works,
  locale,
  value,
  placeholder,
  noResults,
  onChange,
  showResults = false,
  currentWorkId,
}: WorkSearchProps) {
  // 입력된 검색어로 제목과 부제가 일치하는 다른 작품을 찾습니다.
  const results = useMemo(() => {
    const normalizedQuery = value.trim().toLocaleLowerCase(locale);

    if (!normalizedQuery) return [];

    return works
      .filter(
        (work) =>
          work.id !== currentWorkId &&
          (work.title.toLocaleLowerCase(locale).includes(normalizedQuery) ||
            work.subtitle
              ?.toLocaleLowerCase(locale)
              .includes(normalizedQuery)),
      )
      .slice(0, 6);
  }, [currentWorkId, locale, value, works]);

  const isDropdownOpen = showResults && Boolean(value.trim());

  return (
    <div className={styles.search}>
      <label>
        <span className={styles.icon} aria-hidden="true" />
        <span className={styles.srOnly}>{placeholder}</span>
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") event.currentTarget.blur();
          }}
          placeholder={placeholder}
          autoComplete="off"
        />
      </label>

      {isDropdownOpen ? (
        <div className={styles.results}>
          {results.length > 0 ? (
            <ul>
              {results.map((work) => (
                <li key={work.id}>
                  <Link
                    href={`/works/${work.id}`}
                    onClick={() => onChange("")}
                  >
                    <strong>{work.title}</strong>
                    {work.subtitle ? <span>{work.subtitle}</span> : null}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>{noResults}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
