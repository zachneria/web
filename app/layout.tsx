import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "fansonly — underground ticketing",
  description: "Tickets to underground shows. Minimal fees, no account needed.",
  metadataBase: new URL("https://fansonly.live"),
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
