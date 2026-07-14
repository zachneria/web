import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "shabanga — built for promoters and scene makers",
  description: "Tickets to underground shows. Minimal fees, no account needed.",
  metadataBase: new URL("https://shabanga.com"),
  // Favicon + apple-touch icon come from app/icon.png and app/apple-icon.png
  // (Next file convention) — applies to every page.
  openGraph: {
    title: "shabanga",
    description: "Built for promoters and scene makers. Minimal fees, no account needed.",
    url: "https://shabanga.com",
    siteName: "shabanga",
    images: ["/logo.png"],
  },
  twitter: {
    card: "summary",
    title: "shabanga",
    description: "Built for promoters and scene makers.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
