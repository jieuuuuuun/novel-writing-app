import type { Metadata } from "next";
import { Geist } from "next/font/google";
import AuthProvider from "@/components/auth/AuthProvider";
import { defaultLocale, getMessages } from "@/i18n/messages";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const copy = getMessages(defaultLocale);

export const metadata: Metadata = {
  title: copy.metadata.title,
  description: copy.metadata.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang={defaultLocale} className={geistSans.variable}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
