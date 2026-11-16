"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import UserMenu from "@/components/auth/UserMenu";
import { useAuth } from "@/components/auth/AuthProvider";
import WorkSidebar from "@/components/work/WorkSidebar";
import { defaultLocale, getMessages } from "@/i18n/messages";
import { deleteCurrentUser } from "@/lib/auth-api";
import pageStyles from "@/app/page.module.css";
import styles from "./settings.module.css";

export default function AccountSettingsPage() {
  const copy = getMessages(defaultLocale);
  const { user, logout, endSession } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  useEffect(() => {
    if (!isConfirmOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isDeleting) {
        setIsConfirmOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isConfirmOpen, isDeleting]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setLogoutError(false);

    try {
      await logout();
    } catch {
      setLogoutError(true);
      setIsLoggingOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError(false);

    try {
      await deleteCurrentUser();
      endSession();
    } catch {
      setDeleteError(true);
      setIsDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <div className={pageStyles.appShell}>
      <WorkSidebar
        brand={copy.brand}
        navigation={copy.navigation}
        quote={copy.workspace.quote}
        closeLabel={copy.workspace.closeMenu}
        activeMenu="settings"
      />

      <div className={pageStyles.workspace}>
        <header className={pageStyles.topbar}>
          <button
            className={pageStyles.mobileMenuButton}
            type="button"
            aria-expanded={isMenuOpen}
            aria-label={copy.workspace.openMenu}
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            <span />
            <span />
            <span />
          </button>

          <div className={pageStyles.mobileBrand}>
            <span>{copy.brand.name}</span>
            <span className={pageStyles.leafMark} aria-hidden="true" />
          </div>

          <div className={pageStyles.profileArea}>
            <button
              className={pageStyles.notificationButton}
              type="button"
              aria-label={copy.header.notifications}
            >
              <span aria-hidden="true">♢</span>
              <i />
            </button>
            <UserMenu />
          </div>
        </header>

        {isMenuOpen ? (
          <div
            className={pageStyles.mobileMenuBackdrop}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setIsMenuOpen(false);
              }
            }}
          >
            <WorkSidebar
              brand={copy.brand}
              navigation={copy.navigation}
              quote={copy.workspace.quote}
              closeLabel={copy.workspace.closeMenu}
              activeMenu="settings"
              isMobile
              onClose={() => setIsMenuOpen(false)}
            />
          </div>
        ) : null}

        <main className={pageStyles.mainContent}>
          <section className={pageStyles.pageHeading}>
            <span className={pageStyles.eyebrow}>{copy.settings.eyebrow}</span>
            <h1>{copy.settings.title}</h1>
            <p>{copy.settings.description}</p>
          </section>

          <section className={styles.panel} aria-labelledby="account-heading">
            <h2 id="account-heading">{copy.settings.accountTitle}</h2>
            <dl className={styles.accountList}>
              {user.name.trim() ? (
                <div>
                  <dt>{copy.settings.name}</dt>
                  <dd>{user.name}</dd>
                </div>
              ) : null}
              <div>
                <dt>{copy.settings.loginMethod}</dt>
                <dd>{copy.settings.loginProvider}</dd>
              </div>
              <div>
                <dt>{copy.settings.email}</dt>
                <dd>{user.email}</dd>
              </div>
            </dl>
            <button
              className={styles.secondaryButton}
              type="button"
              disabled={isLoggingOut || isDeleting}
              onClick={() => void handleLogout()}
            >
              {isLoggingOut ? copy.auth.loggingOut : copy.auth.logout}
            </button>
            {logoutError ? (
              <p className={styles.error} role="alert">
                {copy.auth.logoutError}
              </p>
            ) : null}
          </section>

          <section className={styles.panel} aria-labelledby="delete-heading">
            <h2 id="delete-heading">{copy.settings.deleteTitle}</h2>
            <p>{copy.settings.deleteDescription}</p>
            <button
              className={styles.dangerButton}
              type="button"
              disabled={isLoggingOut || isDeleting}
              onClick={() => {
                setDeleteError(false);
                setIsConfirmOpen(true);
              }}
            >
              {copy.settings.deleteButton}
            </button>
            {deleteError ? (
              <p className={styles.error} role="alert">
                {copy.settings.deleteError}
              </p>
            ) : null}
          </section>

          <section className={styles.panel} aria-labelledby="legal-heading">
            <h2 id="legal-heading">{copy.settings.legalTitle}</h2>
            <nav className={styles.legalLinks} aria-label={copy.settings.legalTitle}>
              <Link href="/privacy">{copy.legal.privacyTitle}</Link>
              <Link href="/terms">{copy.legal.termsTitle}</Link>
              <Link href="/account-deletion">
                {copy.legal.accountDeletionTitle}
              </Link>
            </nav>
          </section>
        </main>
      </div>

      {isConfirmOpen ? (
        <div
          className={styles.confirmOverlay}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isDeleting) {
              setIsConfirmOpen(false);
            }
          }}
        >
          <section
            className={styles.confirmCard}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
          >
            <h2 id="delete-account-title">{copy.settings.confirmTitle}</h2>
            <p>{copy.settings.confirmDescription}</p>
            <div className={styles.confirmActions}>
              <button
                className={styles.ghostButton}
                type="button"
                disabled={isDeleting}
                onClick={() => setIsConfirmOpen(false)}
              >
                {copy.settings.confirmCancel}
              </button>
              <button
                className={styles.dangerButton}
                type="button"
                disabled={isDeleting}
                onClick={() => void handleDeleteAccount()}
              >
                {isDeleting
                  ? copy.settings.deleting
                  : copy.settings.confirmDelete}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
