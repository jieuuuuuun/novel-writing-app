import type { Metadata } from "next";
import LandingPage from "@/components/landing/LandingPage";
import { defaultLocale, getMessages } from "@/i18n/messages";

const copy = getMessages(defaultLocale);

export const metadata: Metadata = {
  title: copy.landing.metaTitle,
  description: copy.landing.metaDescription,
};

export default function Home() {
  return <LandingPage />;
}
