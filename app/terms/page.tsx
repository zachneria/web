import ReactMarkdown from "react-markdown";

import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { TERMS_MD } from "@/lib/legal";

export const metadata = { title: "Terms of Service — shabanga" };

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="legal">
        <ReactMarkdown>{TERMS_MD}</ReactMarkdown>
      </main>
      <SiteFooter />
    </>
  );
}
