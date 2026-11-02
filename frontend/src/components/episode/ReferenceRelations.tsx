"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Messages } from "@/i18n/messages";
import { getCharacters } from "@/lib/character-api";
import { getRelations } from "@/lib/relation-api";
import type { Relation } from "@/types/relation";
import styles from "@/app/works/[workId]/episodes/editor.module.css";

interface ReferenceRelationsProps {
  workId: number;
  copy: Messages["workspace"]["episodeEditor"]["referenceRelations"];
}

function formatRelationBond(relation: Relation) {
  const type = relation.type.trim();

  return type
    ? `${relation.characterA.name} ─ ${type} ─ ${relation.characterB.name}`
    : `${relation.characterA.name} ↔ ${relation.characterB.name}`;
}

export default function ReferenceRelations({
  workId,
  copy,
}: ReferenceRelationsProps) {
  const [relations, setRelations] = useState<Relation[]>([]);
  const [characterCount, setCharacterCount] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const loadRelations = async (signal?: AbortSignal) => {
    try {
      const [relationData, characterData] = await Promise.all([
        getRelations(workId, signal),
        getCharacters(workId, signal),
      ]);
      setRelations(relationData ?? []);
      setCharacterCount((characterData ?? []).length);
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

    Promise.all([
      getRelations(workId, controller.signal),
      getCharacters(workId, controller.signal),
    ])
      .then(([relationData, characterData]) => {
        setRelations(relationData ?? []);
        setCharacterCount((characterData ?? []).length);
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

  const selectedRelation =
    selectedId === null
      ? null
      : (relations.find((relation) => relation.id === selectedId) ?? null);

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
            void loadRelations();
          }}
        >
          {copy.retry}
        </button>
      </div>
    );
  }

  if (relations.length === 0) {
    const emptyCopy =
      characterCount === 0
        ? {
            title: copy.emptyNoCharacters,
            href: `/works/${workId}/characters/new`,
            action: copy.addCharacter,
          }
        : characterCount === 1
          ? {
              title: copy.emptyOneCharacter,
              href: `/works/${workId}/characters/new`,
              action: copy.addCharacter,
            }
          : {
              title: copy.empty,
              href: `/works/${workId}/relations/new`,
              action: copy.addRelation,
            };

    return (
      <div className={styles.referenceEmpty}>
        <strong>{emptyCopy.title}</strong>
        <Link href={emptyCopy.href}>{emptyCopy.action}</Link>
      </div>
    );
  }

  if (selectedRelation) {
    const aToBLabel = selectedRelation.aToBLabel.trim();
    const aToBNote = selectedRelation.aToBNote.trim();
    const bToALabel = selectedRelation.bToALabel.trim();
    const bToANote = selectedRelation.bToANote.trim();
    const summary = selectedRelation.summary.trim();
    const directions = [
      {
        key: "aToB",
        from: selectedRelation.characterA.name,
        to: selectedRelation.characterB.name,
        label: aToBLabel,
        note: aToBNote,
      },
      {
        key: "bToA",
        from: selectedRelation.characterB.name,
        to: selectedRelation.characterA.name,
        label: bToALabel,
        note: bToANote,
      },
    ].filter((direction) => direction.label || direction.note);

    return (
      <div className={styles.referenceDetail}>
        <button
          className={styles.referenceBack}
          type="button"
          onClick={() => setSelectedId(null)}
        >
          <span aria-hidden="true">←</span>
          {copy.backToList}
        </button>
        <h3>{formatRelationBond(selectedRelation)}</h3>
        {summary ? <p>{summary}</p> : null}
        {directions.length > 0 ? (
          <dl>
            {directions.map((direction) => (
              <div className={styles.referenceDirection} key={direction.key}>
                <p>
                  {direction.from} → {direction.to}
                </p>
                {direction.label ? <strong>{direction.label}</strong> : null}
                {direction.note ? (
                  <p className={styles.referenceDirectionNote}>
                    {direction.note}
                  </p>
                ) : null}
              </div>
            ))}
          </dl>
        ) : null}
        <Link
          className={styles.referenceEditLink}
          href={`/works/${workId}/relations/${selectedRelation.id}`}
        >
          {copy.editInSheet}
        </Link>
      </div>
    );
  }

  return (
    <ul className={styles.referenceCharacterList}>
      {relations.map((relation) => {
        const type = relation.type.trim();
        const summary = relation.summary.trim();

        return (
          <li key={relation.id}>
            <button type="button" onClick={() => setSelectedId(relation.id)}>
              <span className={styles.referenceRelationPair}>
                <strong>{relation.characterA.name}</strong>
                <span>{type || "↔"}</span>
                <strong>{relation.characterB.name}</strong>
              </span>
              {summary ? (
                <p className={styles.referenceRelationSummary}>{summary}</p>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
