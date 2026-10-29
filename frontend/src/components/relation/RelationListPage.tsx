"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import UserMenu from "@/components/auth/UserMenu";
import WorkSearch from "@/components/work/WorkSearch";
import WorkspaceSidebar from "@/components/workspace/WorkspaceSidebar";
import { defaultLocale, getMessages, type Messages } from "@/i18n/messages";
import { getCharacters } from "@/lib/character-api";
import { getRelations } from "@/lib/relation-api";
import { getWork, getWorks } from "@/lib/work-api";
import type { Character } from "@/types/character";
import type { Relation, RelationCharacter } from "@/types/relation";
import type { Work } from "@/types/work";
import styles from "@/app/works/[workId]/relations/relations.module.css";
import workspaceStyles from "@/app/works/[workId]/workspace.module.css";

interface RelationListPageProps {
  workId: string;
}

function NewRelationCta({
  href,
  className,
  copy,
}: {
  href?: string;
  className: string;
  copy: Messages["workspace"]["relationList"];
}) {
  const label = (
    <>
      <span aria-hidden="true">＋</span>
      {copy.newRelation}
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

function RelationPerson({ character }: { character: RelationCharacter }) {
  return (
    <div className={styles.person}>
      <strong>{character.name}</strong>
      {character.role ? <span>{character.role}</span> : null}
    </div>
  );
}

function RelationDirection({
  from,
  to,
  label,
  note,
}: {
  from: string;
  to: string;
  label: string;
  note: string;
}) {
  if (!label && !note) return null;

  return (
    <div className={styles.direction}>
      <p className={styles.directionNames}>
        {from} → {to}
      </p>
      {label ? <strong>{label}</strong> : null}
      {note ? <p className={styles.directionNote}>{note}</p> : null}
    </div>
  );
}

export default function RelationListPage({ workId }: RelationListPageProps) {
  const locale = defaultLocale;
  const copy = getMessages(locale);
  const numericWorkId = Number(workId);
  const isValidWorkId = Number.isInteger(numericWorkId) && numericWorkId > 0;
  const listCopy = copy.workspace.relationList;

  const [work, setWork] = useState<Work | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [allWorks, setAllWorks] = useState<Work[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(isValidWorkId);
  const [loadError, setLoadError] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const loadPage = async () => {
    if (!isValidWorkId) return;

    try {
      const [workData, characterData, relationData, workListData] =
        await Promise.all([
          getWork(numericWorkId),
          getCharacters(numericWorkId),
          getRelations(numericWorkId),
          getWorks().catch(() => []),
        ]);
      setWork(workData && characterData && relationData ? workData : null);
      setCharacters(characterData ?? []);
      setRelations(relationData ?? []);
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
      getRelations(numericWorkId, controller.signal),
      getWorks(controller.signal).catch(() => []),
    ])
      .then(([workData, characterData, relationData, workListData]) => {
        setWork(workData && characterData && relationData ? workData : null);
        setCharacters(characterData ?? []);
        setRelations(relationData ?? []);
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
  const canCreateRelation = characters.length >= 2;
  const newRelationHref = `/works/${numericWorkId}/relations/new`;

  let emptyState: {
    title: string;
    description: string;
    action: ReactNode;
  } | null = null;

  if (characters.length === 0) {
    emptyState = {
      title: listCopy.emptyNoCharacters,
      description: listCopy.emptyNoCharactersDescription,
      action: (
        <Link
          className={styles.addCharacterButton}
          href={`/works/${numericWorkId}/characters/new`}
        >
          {listCopy.addCharacter}
        </Link>
      ),
    };
  } else if (characters.length === 1) {
    emptyState = {
      title: listCopy.emptyOneCharacter,
      description: listCopy.emptyOneCharacterDescription,
      action: (
        <Link
          className={styles.addCharacterButton}
          href={`/works/${numericWorkId}/characters/new`}
        >
          {listCopy.addCharacter}
        </Link>
      ),
    };
  } else if (relations.length === 0) {
    emptyState = {
      title: listCopy.empty,
      description: listCopy.emptyDescription,
      action: (
        <NewRelationCta
          href={newRelationHref}
          className={styles.newRelationButton}
          copy={listCopy}
        />
      ),
    };
  }

  return (
    <div className={workspaceStyles.workspaceShell}>
      <WorkspaceSidebar
        copy={copy.workspace}
        brand={copy.brand}
        workId={numericWorkId}
        activeMenu="relationships"
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
              activeMenu="relationships"
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
          <main className={styles.relationsPage}>
            <header className={styles.pageHeader}>
              <div>
                <Link href={`/works/${work.id}`}>
                  <span aria-hidden="true">←</span>
                  {listCopy.backToHome}
                </Link>
                <h1>{listCopy.title}</h1>
                <p>{listCopy.description}</p>
              </div>
              {canCreateRelation ? (
                <NewRelationCta
                  href={newRelationHref}
                  className={styles.newRelationButton}
                  copy={listCopy}
                />
              ) : null}
            </header>

            {emptyState ? (
              <section className={styles.emptyState}>
                <span aria-hidden="true">⌘</span>
                <h2>{emptyState.title}</h2>
                <p>{emptyState.description}</p>
                {emptyState.action}
              </section>
            ) : (
              <section className={styles.listSection}>
                <header className={styles.listToolbar}>
                  <h2>{listCopy.title}</h2>
                  <span>{listCopy.totalCount(relations.length)}</span>
                </header>
                <ul className={styles.relationList}>
                  {relations.map((relation) => (
                    <li key={relation.id}>
                      <Link
                        className={styles.relationRow}
                        href={`/works/${work.id}/relations/${relation.id}`}
                      >
                        <div className={styles.pair}>
                          <RelationPerson character={relation.characterA} />
                          <div className={styles.connector} aria-hidden="true">
                            <span className={styles.line} />
                            <span className={styles.connectorLabel}>
                              {relation.type || "↔"}
                            </span>
                            <span className={styles.line} />
                          </div>
                          <RelationPerson character={relation.characterB} />
                        </div>
                        {relation.summary ? (
                          <p className={styles.summary}>{relation.summary}</p>
                        ) : null}
                        <RelationDirection
                          from={relation.characterA.name}
                          to={relation.characterB.name}
                          label={relation.aToBLabel}
                          note={relation.aToBNote}
                        />
                        <RelationDirection
                          from={relation.characterB.name}
                          to={relation.characterA.name}
                          label={relation.bToALabel}
                          note={relation.bToANote}
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </main>
        )}
      </div>
    </div>
  );
}
