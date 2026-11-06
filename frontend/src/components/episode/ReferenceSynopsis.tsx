"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Messages } from "@/i18n/messages";
import { getCurrentSynopsis } from "@/lib/synopsis-api";
import type { SynopsisDetail } from "@/types/synopsis";
import styles from "@/app/works/[workId]/episodes/editor.module.css";

interface ReferenceSynopsisProps {
  workId: number;
  copy: Messages["workspace"]["episodeEditor"]["referenceSynopsis"];
}

function isBlank(value: string) {
  return !value.trim();
}

export default function ReferenceSynopsis({
  workId,
  copy,
}: ReferenceSynopsisProps) {
  const [synopsis, setSynopsis] = useState<SynopsisDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const loadSynopsis = async (signal?: AbortSignal) => {
    try {
      const data = await getCurrentSynopsis(workId, signal);
      setSynopsis(data?.current ?? null);
      setLoadError(false);
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setLoadError(true);
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    getCurrentSynopsis(workId, controller.signal)
      .then((data) => {
        setSynopsis(data?.current ?? null);
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
  }, [workId]);

  if (isLoading) {
    return <p className={styles.referenceStatus}>{copy.loading}</p>;
  }

  if (loadError) {
    return (
      <div className={styles.referenceEmpty}>
        <p>{copy.loadError}</p>
        <button
          type="button"
          onClick={() => {
            setIsLoading(true);
            setLoadError(false);
            void loadSynopsis();
          }}
        >
          {copy.retry}
        </button>
      </div>
    );
  }

  if (!synopsis) {
    return (
      <div className={styles.referenceEmpty}>
        <strong>{copy.empty}</strong>
        <Link href={`/works/${workId}/synopsis`}>{copy.addSynopsis}</Link>
      </div>
    );
  }

  const fields = [
    { key: "summary", label: copy.summary, value: synopsis.summary },
    { key: "beginning", label: copy.beginning, value: synopsis.beginning },
    { key: "development", label: copy.development, value: synopsis.development },
    { key: "crisis", label: copy.crisis, value: synopsis.crisis },
    { key: "ending", label: copy.ending, value: synopsis.ending },
  ].filter((item) => !isBlank(item.value));

  return (
    <div className={styles.referenceDetail}>
      {synopsis.title.trim() ? <h3>{synopsis.title}</h3> : null}
      {fields.length > 0 ? (
        <dl>
          {fields.map((item) => (
            <div key={item.key}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <Link
        className={styles.referenceEditLink}
        href={`/works/${workId}/synopsis`}
      >
        {copy.editInSheet}
      </Link>
    </div>
  );
}
