import type { Metadata } from "next";
import LegalDocumentPage from "@/components/legal/LegalDocumentPage";
import { defaultLocale, getMessages } from "@/i18n/messages";

const copy = getMessages(defaultLocale);

export const metadata: Metadata = {
  title: copy.legal.privacyMetaTitle,
  description: copy.legal.privacyDescription,
};

export default function PrivacyPage() {
  return <LegalDocumentPage kind="privacy" />;
}
