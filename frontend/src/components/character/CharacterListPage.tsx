"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import UserMenu from "@/components/auth/UserMenu";
import WorkSearch from "@/components/work/WorkSearch";
import WorkspaceSidebar from "@/components/workspace/WorkspaceSidebar";
import { defaultLocale, getMessages, type Messages } from "@/i18n/messages";
import { getCharacters } from "@/lib/character-api";
import { getWork, getWorks } from "@/lib/work-api";
import type { Character } from "@/types/character";
import type { Work } from "@/types/work";
import styles from "@/app/works/[workId]/characters/characters.module.css";
import workspaceStyles from "@/app/works/[workId]/workspace.module.css";

interface CharacterListPageProps {
  workId: string;
}

function formatCharacterMeta(character: Character) {
  return [character.age, character.occupation].filter(Boolean).join(" · ");
}

function NewCharacterCta({
  href,
  className,
  copy,
}: {
  href?: string;
  className: string;
  copy: Messages["workspace"]["characterList"];
}) {
  const label = (
    <>
      <span aria-hidden="true">＋</span>
      {copy.newCharacter}
    </>
  );

  if (href) {
    return (
      <Link className={className} href={href}>
        {label}
      </Link>
    );
  }

  return (
    <button
      className={className}
      type="button"
      disabled
      title={copy.preparing}
    >
      {label}
    </button>
  );
}

export default function CharacterListPage({ workId }: CharacterListPageProps) {
  const locale = defaultLocale;
  const copy = getMessages(locale);
  const numericWorkId = Number(workId);
  const isValidWorkId = Number.isInteger(numericWorkId) && numericWorkId > 0;

  const [work, setWork] = useState<Work | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [allWorks, setAllWorks] = useState<Work[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(isValidWorkId);
  const [loadError, setLoadError] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const loadPage = async () => {
    if (!isValidWorkId) return;

    try {
      const [workData, characterData, workListData] = await Promise.all([
        getWork(numericWorkId),
        getCharacters(numericWorkId),
        getWorks().catch(() => []),
      ]);
      setWork(workData && characterData ? workData : null);
      setCharacters(characterData ?? []);
      setAllWorks(workListData);
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isValidWorkId) return;

    const controller = new AbortController();

    Promise.all([
      getWork(numericWorkId, controller.signal),
      getCharacters(numericWorkId, controller.signal),
      getWorks(controller.signal).catch(() => []),
    ])
      .then(([workData, characterData, workListData]) => {
        setWork(workData && characterData ? workData : null);
        setCharacters(characterData ?? []);
        setAllWorks(workListData);
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
  }, [isValidWorkId, numericWorkId]);

  const statusMessage = loadError
    ? copy.workspace.states.error
    : copy.workspace.states.notFound;

  return (
    <div className={workspaceStyles.workspaceShell}>
      <WorkspaceSidebar
        copy={copy.workspace}
        brand={copy.brand}
        workId={numericWorkId}
        activeMenu="characters"
      />

      <div className={workspaceStyles.workspaceBody}>
        <header className={workspaceStyles.workspaceTopbar}>
          <button
            className={workspaceStyles.mobileMenuButton}
            type="button"
            aria-expanded={isMenuOpen}
            aria-label={copy.workspace.openMenu}
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            <span />
            <span />
            <span />
          </button>

          <Link href="/works" className={workspaceStyles.mobileBrand}>
            {copy.brand.name}
            <i aria-hidden="true" />
          </Link>

          <WorkSearch
            works={allWorks}
            locale={locale}
            value={searchQuery}
            placeholder={copy.header.searchPlaceholder}
            noResults={copy.dashboard.noResultsTitle}
            onChange={setSearchQuery}
            showResults
            currentWorkId={numericWorkId}
          />

          <div className={workspaceStyles.topbarActions}>
            <button
              type="button"
              aria-label={copy.header.notifications}
              disabled
            >
              ♢
              <i />
            </button>
            <UserMenu />
          </div>
        </header>

        {isMenuOpen ? (
          <div
            className={workspaceStyles.mobileMenuBackdrop}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setIsMenuOpen(false);
              }
            }}
          >
            <WorkspaceSidebar
              copy={copy.workspace}
              brand={copy.brand}
              workId={numericWorkId}
              activeMenu="characters"
              isMobile
              onClose={() => setIsMenuOpen(false)}
            />
          </div>
        ) : null}

        {isLoading ? (
          <main className={workspaceStyles.workspaceStatus} aria-live="polite">
            <span />
            <p>{copy.workspace.states.loading}</p>
          </main>
        ) : loadError || !work ? (
          <main className={workspaceStyles.workspaceStatus}>
            <strong>!</strong>
            <h1>{statusMessage}</h1>
            {loadError ? (
              <button
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  setLoadError(false);
                  void loadPage();
                }}
              >
                {copy.workspace.states.retry}
              </button>
            ) : null}
            <Link href="/works">{copy.workspace.backToWorks}</Link>
          </main>
        ) : (
          <main className={styles.charactersPage}>
            <header className={styles.pageHeader}>
              <div>
                <Link href={`/works/${work.id}`}>
                  <span aria-hidden="true">←</span>
                  {copy.workspace.characterList.backToHome}
                </Link>
                <h1>{copy.workspace.characterList.title}</h1>
                <p>{copy.workspace.characterList.description}</p>
              </div>
              <NewCharacterCta
                href={`/works/${work.id}/characters/new`}
                className={styles.newCharacterButton}
                copy={copy.workspace.characterList}
              />
            </header>

            {characters.length === 0 ? (
              <section className={styles.emptyState}>
                <span aria-hidden="true">♙</span>
                <h2>{copy.workspace.characterList.empty}</h2>
                <p>{copy.workspace.characterList.emptyDescription}</p>
                <NewCharacterCta
                  href={`/works/${work.id}/characters/new`}
                  className={styles.newCharacterButton}
                  copy={copy.workspace.characterList}
                />
              </section>
            ) : (
              <section className={styles.listSection}>
                <header className={styles.listToolbar}>
                  <h2>{copy.workspace.characterList.title}</h2>
                  <span>
                    {copy.workspace.characterList.totalCount(characters.length)}
                  </span>
                </header>
                <ul className={styles.characterList}>
                  {characters.map((character) => {
                    const meta = formatCharacterMeta(character);

                    return (
                      <li key={character.id}>
                        <Link
                          className={styles.characterRow}
                          href={`/works/${work.id}/characters/${character.id}`}
                        >
                          <div className={styles.characterIdentity}>
                            <strong>{character.name}</strong>
                            {character.role ? (
                              <span className={styles.characterRole}>
                                {character.role}
                              </span>
                            ) : null}
                          </div>
                          {meta ? (
                            <p className={styles.characterMeta}>{meta}</p>
                          ) : null}
                          {character.summary ? (
                            <p className={styles.characterSummary}>
                              {character.summary}
                            </p>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </main>
        )}
      </div>
    </div>
  );
}
