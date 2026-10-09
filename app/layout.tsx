import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-instrument-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Learnbay Projects",
    template: "%s · Learnbay Projects",
  },
  description:
    "Real projects, built by Learnbay students. Browse data, AI, and software projects by domain, tool or industry — or look up a student.",
  metadataBase: new URL("https://projects.learnbay.co"),
  openGraph: {
    title: "Learnbay Projects",
    description: "Real projects, built by Learnbay students.",
    siteName: "Learnbay Projects",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={instrumentSans.variable}>
      <body>{children}</body>
    </html>
  );
}
