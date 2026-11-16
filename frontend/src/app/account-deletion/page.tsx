import type { Metadata } from "next";
import LegalDocumentPage from "@/components/legal/LegalDocumentPage";
import { defaultLocale, getMessages } from "@/i18n/messages";

const copy = getMessages(defaultLocale);

export const metadata: Metadata = {
  title: copy.legal.accountDeletionMetaTitle,
  description: copy.legal.accountDeletionDescription,
};

export default function AccountDeletionPage() {
  return <LegalDocumentPage kind="account-deletion" />;
}
