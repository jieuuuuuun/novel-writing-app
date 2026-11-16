import type { Metadata } from "next";
import LegalDocumentPage from "@/components/legal/LegalDocumentPage";
import { defaultLocale, getMessages } from "@/i18n/messages";

const copy = getMessages(defaultLocale);

export const metadata: Metadata = {
  title: copy.legal.termsMetaTitle,
  description: copy.legal.termsDescription,
};

export default function TermsPage() {
  return <LegalDocumentPage kind="terms" />;
}
