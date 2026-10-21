"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { defaultLocale, getMessages } from "@/i18n/messages";
import { useAuth } from "./AuthProvider";
import styles from "./auth.module.css";

function getInitial(name: string, email: string): string {
  const source = name.trim() || email.trim();
  return Array.from(source)[0]?.toLocaleUpperCase(defaultLocale) ?? "?";
}

export default function UserMenu() {
  const copy = getMessages(defaultLocale);
  const { user, logout } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(false);
  const initial = useMemo(
    () => (user ? getInitial(user.name, user.email) : "?"),
    [user],
  );

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!user) return null;

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

  return (
    <div className={styles.userMenu} ref={containerRef}>
      <button
        className={styles.profileTrigger}
        type="button"
        aria-label={copy.header.profile}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => {
          setIsOpen((current) => !current);
          setLogoutError(false);
        }}
      >
        <span className={styles.avatar}>{initial}</span>
        <span className={styles.chevron} aria-hidden="true" />
      </button>

      {isOpen ? (
        <div className={styles.profileMenu} role="menu">
          <div className={styles.profileInfo}>
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
          <button
            className={styles.logoutButton}
            type="button"
            role="menuitem"
            disabled={isLoggingOut}
            onClick={() => void handleLogout()}
          >
            {isLoggingOut ? copy.auth.loggingOut : copy.auth.logout}
          </button>
          {logoutError ? (
            <p className={styles.logoutError}>{copy.auth.logoutError}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
