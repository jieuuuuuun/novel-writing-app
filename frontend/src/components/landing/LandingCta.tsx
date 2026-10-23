"use client";

import Link from "next/link";
import type { Messages } from "@/i18n/messages";
import { useAuth } from "@/components/auth/AuthProvider";
import { getGoogleLoginUrl } from "@/lib/auth-api";
import styles from "./landing.module.css";

interface LandingCtaProps {
  copy: Messages["landing"];
  variant?: "header" | "hero" | "bottom";
}

export default function LandingCta({
  copy,
  variant = "header",
}: LandingCtaProps) {
  const { authenticated, status } = useAuth();
  const className =
    variant === "hero"
      ? styles.heroCta
      : variant === "bottom"
        ? styles.bottomCta
        : styles.cta;

  if (status === "loading") {
    return (
      <button className={className} type="button" disabled>
        {copy.startWithGoogle}
      </button>
    );
  }

  if (authenticated) {
    return (
      <Link className={className} href="/works">
        {copy.goToWorks}
      </Link>
    );
  }

  return (
    <a className={className} href={getGoogleLoginUrl()}>
      {variant === "header" ? null : (
        <span className={styles.googleMark} aria-hidden="true">
          G
        </span>
      )}
      {copy.startWithGoogle}
      {variant === "hero" ? <span aria-hidden="true">→</span> : null}
    </a>
  );
}
