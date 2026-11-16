import Link from "next/link";
import { defaultLocale, getMessages } from "@/i18n/messages";
import {
  accountDeletionDocument,
  privacyDocument,
  termsDocument,
  type LegalDocument,
} from "@/content/legal";
import styles from "./legal.module.css";

interface LegalDocumentPageProps {
  kind: "privacy" | "terms" | "account-deletion";
}

const CONTACT_EMAIL = "jedevstudio1@gmail.com";

const documents: Record<LegalDocumentPageProps["kind"], LegalDocument> = {
  privacy: privacyDocument,
  terms: termsDocument,
  "account-deletion": accountDeletionDocument,
};

function renderText(text: string) {
  if (!text.includes(CONTACT_EMAIL)) {
    return text;
  }

  return text.split(CONTACT_EMAIL).flatMap((part, index) =>
    index === 0
      ? [part]
      : [
          <a href={`mailto:${CONTACT_EMAIL}`} key={`${text}-${index}`}>
            {CONTACT_EMAIL}
          </a>,
          part,
        ],
  );
}

function renderDocument(document: LegalDocument) {
  return (
    <article className={styles.article}>
      {document.effectiveDate ? (
        <p className={styles.effectiveDate}>
          {`시행일 ${document.effectiveDate}`}
        </p>
      ) : null}
      <p className={styles.intro}>{document.intro}</p>
      {document.sections.map((section) => (
        <section key={section.heading}>
          <h2>{section.heading}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph}>{renderText(paragraph)}</p>
          ))}
          {section.bullets ? (
            <ul>
              {section.bullets.map((item) => (
                <li key={item}>{renderText(item)}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </article>
  );
}

export default function LegalDocumentPage({ kind }: LegalDocumentPageProps) {
  const copy = getMessages(defaultLocale);
  const document = documents[kind];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/">
          {copy.brand.name}
          <span className={styles.leafMark} aria-hidden="true" />
        </Link>
        <Link className={styles.homeLink} href="/">
          {copy.legal.backHome}
        </Link>
      </header>
      <main className={styles.main}>
        <h1>{document.title}</h1>
        {renderDocument(document)}
        <nav className={styles.docLinks} aria-label={copy.settings.legalTitle}>
          <Link href="/privacy">{copy.legal.privacyTitle}</Link>
          <Link href="/terms">{copy.legal.termsTitle}</Link>
          <Link href="/account-deletion">
            {copy.legal.accountDeletionTitle}
          </Link>
        </nav>
      </main>
    </div>
  );
}
