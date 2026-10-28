"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Messages } from "@/i18n/messages";
import { getCharacters } from "@/lib/character-api";
import type { Character } from "@/types/character";
import styles from "@/app/works/[workId]/episodes/editor.module.css";

interface ReferenceCharactersProps {
  workId: number;
  copy: Messages["workspace"]["episodeEditor"]["referenceCharacters"];
  fieldCopy: Messages["workspace"]["characterSheet"];
}

function formatCharacterMeta(character: Character) {
  return [character.age, character.occupation].filter(Boolean).join(" · ");
}

export default function ReferenceCharacters({
  workId,
  copy,
  fieldCopy,
}: ReferenceCharactersProps) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const loadCharacters = async (signal?: AbortSignal) => {
    try {
      const data = await getCharacters(workId, signal);
      setCharacters(data ?? []);
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

    getCharacters(workId, controller.signal)
      .then((data) => {
        setCharacters(data ?? []);
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

  const selectedCharacter =
    selectedId === null
      ? null
      : (characters.find((character) => character.id === selectedId) ?? null);

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
            void loadCharacters();
          }}
        >
          {copy.retry}
        </button>
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <div className={styles.referenceEmpty}>
        <strong>{copy.empty}</strong>
        <p>{copy.emptyDescription}</p>
        <Link href={`/works/${workId}/characters/new`}>{copy.addCharacter}</Link>
      </div>
    );
  }

  if (selectedCharacter) {
    const details = [
      { label: fieldCopy.role, value: selectedCharacter.role },
      { label: fieldCopy.age, value: selectedCharacter.age },
      { label: fieldCopy.occupation, value: selectedCharacter.occupation },
      { label: fieldCopy.summary, value: selectedCharacter.summary },
      { label: fieldCopy.goal, value: selectedCharacter.goal },
      { label: fieldCopy.trauma, value: selectedCharacter.trauma },
      { label: fieldCopy.weakness, value: selectedCharacter.weakness },
      { label: fieldCopy.lack, value: selectedCharacter.lack },
      { label: fieldCopy.quote, value: selectedCharacter.quote },
    ].filter((item) => item.value.trim());

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
        <h3>{selectedCharacter.name}</h3>
        {details.length > 0 ? (
          <dl>
            {details.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        <Link
          className={styles.referenceEditLink}
          href={`/works/${workId}/characters/${selectedCharacter.id}`}
        >
          {copy.editInSheet}
        </Link>
      </div>
    );
  }

  return (
    <ul className={styles.referenceCharacterList}>
      {characters.map((character) => {
        const meta = formatCharacterMeta(character);

        return (
          <li key={character.id}>
            <button
              type="button"
              onClick={() => setSelectedId(character.id)}
            >
              <strong>{character.name}</strong>
              {character.role ? <span>{character.role}</span> : null}
              {meta ? <small>{meta}</small> : null}
              {character.summary ? <p>{character.summary}</p> : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
