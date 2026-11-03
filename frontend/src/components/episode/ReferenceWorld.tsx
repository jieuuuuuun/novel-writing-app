"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Messages } from "@/i18n/messages";
import { getWorldSetting } from "@/lib/world-api";
import type { WorldSetting } from "@/types/world";
import styles from "@/app/works/[workId]/episodes/editor.module.css";

interface ReferenceWorldProps {
  workId: number;
  copy: Messages["workspace"]["episodeEditor"]["referenceWorld"];
}

function isBlank(value: string) {
  return !value.trim();
}

export default function ReferenceWorld({ workId, copy }: ReferenceWorldProps) {
  const [world, setWorld] = useState<WorldSetting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const loadWorld = async (signal?: AbortSignal) => {
    try {
      const data = await getWorldSetting(workId, signal);
      setWorld(data);
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

    getWorldSetting(workId, controller.signal)
      .then((data) => {
        setWorld(data);
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
            void loadWorld();
          }}
        >
          {copy.retry}
        </button>
      </div>
    );
  }

  const basics = [
    { key: "era", label: copy.era, value: world?.era ?? "" },
    { key: "places", label: copy.places, value: world?.places ?? "" },
    { key: "atmosphere", label: copy.atmosphere, value: world?.atmosphere ?? "" },
  ].filter((item) => !isBlank(item.value));

  const customFields = [...(world?.customFields ?? [])]
    .sort(
      (left, right) =>
        left.sortOrder - right.sortOrder || left.id - right.id,
    )
    .filter((field) => !isBlank(field.label) || !isBlank(field.value));

  if (basics.length === 0 && customFields.length === 0) {
    return (
      <div className={styles.referenceEmpty}>
        <strong>{copy.empty}</strong>
        <Link href={`/works/${workId}/world`}>{copy.addWorld}</Link>
      </div>
    );
  }

  return (
    <div className={styles.referenceDetail}>
      {basics.length > 0 ? (
        <dl>
          {basics.map((item) => (
            <div key={item.key}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {customFields.length > 0 ? (
        <dl>
          {customFields.map((field) => (
            <div key={field.id}>
              {field.label.trim() ? <dt>{field.label}</dt> : null}
              {field.value.trim() ? <dd>{field.value}</dd> : null}
            </div>
          ))}
        </dl>
      ) : null}
      <Link
        className={styles.referenceEditLink}
        href={`/works/${workId}/world`}
      >
        {copy.editInSheet}
      </Link>
    </div>
  );
}
