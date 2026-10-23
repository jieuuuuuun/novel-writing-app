"use client";

import { useState } from "react";
import {
  defaultLocale,
  getMessages,
} from "@/i18n/messages";
import LandingCta from "./LandingCta";
import LandingPreview from "./LandingPreview";
import styles from "./landing.module.css";

const featureIcons = ["▤", "✎", "☁"];

export default function LandingPage() {
  const copy = getMessages(defaultLocale);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <a className={styles.brand} href="#top">
          {copy.brand.name}
          <span className={styles.leafMark} aria-hidden="true" />
        </a>

        <nav className={styles.headerNav} aria-label={copy.landing.navFeatures}>
          <a href="#features">{copy.landing.navFeatures}</a>
          <a href="#about">{copy.landing.navAbout}</a>
          <a href="#faq">{copy.landing.navFaq}</a>
        </nav>

        <div className={styles.headerActions}>
          <LandingCta copy={copy.landing} />
          <button
            className={styles.menuButton}
            type="button"
            aria-expanded={isMenuOpen}
            aria-label={
              isMenuOpen ? copy.landing.closeMenu : copy.landing.openMenu
            }
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {isMenuOpen ? (
        <nav className={styles.mobileNav}>
          <a href="#features" onClick={() => setIsMenuOpen(false)}>
            {copy.landing.navFeatures}
          </a>
          <a href="#about" onClick={() => setIsMenuOpen(false)}>
            {copy.landing.navAbout}
          </a>
          <a href="#faq" onClick={() => setIsMenuOpen(false)}>
            {copy.landing.navFaq}
          </a>
        </nav>
      ) : null}

      <main id="top">
        <section className={styles.hero}>
          <span className={styles.eyebrow}>{copy.landing.eyebrow}</span>
          <h1>{copy.landing.title}</h1>
          <p>{copy.landing.description}</p>
          <LandingCta copy={copy.landing} variant="hero" />
          <p className={styles.note}>{copy.landing.note}</p>
        </section>

        <LandingPreview copy={copy} />

        <section className={styles.section} id="features">
          <h2>{copy.landing.featuresTitle}</h2>
          <div className={styles.featureGrid}>
            {copy.landing.features.map((feature, index) => (
              <article className={styles.featureCard} key={feature.title}>
                <span className={styles.featureIcon} aria-hidden="true">
                  {featureIcons[index]}
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={`${styles.section} ${styles.about}`} id="about">
          <h2>{copy.landing.aboutTitle}</h2>
          <p>{copy.landing.aboutDescription}</p>
        </section>

        <section className={`${styles.section} ${styles.faq}`} id="faq">
          <h2>{copy.landing.faqTitle}</h2>
          <dl className={styles.faqList}>
            {copy.landing.faq.map((item) => (
              <div key={item.question}>
                <dt>{item.question}</dt>
                <dd>{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className={styles.bottomCtaWrap}>
          <h2>{copy.landing.bottomTitle}</h2>
          <LandingCta copy={copy.landing} variant="bottom" />
        </section>
      </main>
    </div>
  );
}
