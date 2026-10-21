"use client";

import type { Messages } from "@/i18n/messages";
import { getGoogleLoginUrl } from "@/lib/auth-api";
import styles from "./auth.module.css";

interface LoginScreenProps {
  brand: Messages["brand"];
  copy: Messages["auth"];
  hasError?: boolean;
  onRetry?: () => void;
}

export default function LoginScreen({
  brand,
  copy,
  hasError = false,
  onRetry,
}: LoginScreenProps) {
  return (
    <main className={styles.authScreen}>
      <section className={styles.authCard}>
        <span className={styles.brand}>{brand.name}</span>
        <h1>{hasError ? copy.checkError : copy.loginTitle}</h1>
        <p>{hasError ? copy.checkErrorDescription : copy.loginDescription}</p>

        {hasError ? (
          <button
            className={styles.retryButton}
            type="button"
            onClick={onRetry}
          >
            {copy.retry}
          </button>
        ) : (
          <button
            className={styles.loginButton}
            type="button"
            onClick={() => window.location.assign(getGoogleLoginUrl())}
          >
            <span aria-hidden="true">G</span>
            {copy.googleLogin}
          </button>
        )}
      </section>
    </main>
  );
}
