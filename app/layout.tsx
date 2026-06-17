import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "fansonly — built for promoters and scene makers",
  description: "Tickets to underground shows. Minimal fees, no account needed.",
  metadataBase: new URL("https://fansonly.live"),
  icons: { icon: "/icon.png", apple: "/icon.png" },
  openGraph: {
    title: "fansonly",
    description: "Built for promoters and scene makers. Minimal fees, no account needed.",
    url: "https://fansonly.live",
    siteName: "fansonly",
    images: ["/icon.png"],
  },
  twitter: {
    card: "summary",
    title: "fansonly",
    description: "Built for promoters and scene makers.",
    images: ["/icon.png"],
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
