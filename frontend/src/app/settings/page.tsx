import type { Metadata } from "next";
import AccountSettingsPage from "@/components/settings/AccountSettingsPage";
import { defaultLocale, getMessages } from "@/i18n/messages";

const copy = getMessages(defaultLocale);

export const metadata: Metadata = {
  title: copy.settings.metaTitle,
  description: copy.settings.metaDescription,
};

export default function SettingsPage() {
  return <AccountSettingsPage />;
}
