import ReactMarkdown from "react-markdown";

import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { PRIVACY_MD } from "@/lib/legal";

export const metadata = { title: "Privacy Policy — shabanga" };

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="legal">
        <ReactMarkdown>{PRIVACY_MD}</ReactMarkdown>
      </main>
      <SiteFooter />
    </>
  );
}
