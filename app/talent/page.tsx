import Link from "next/link";

import { SiteFooter, SiteHeader } from "@/components/site-chrome";

// Stub — the Talent dashboard is coming. A separate Talent login lands here
// later (see CLAUDE.md). For now it's a branded "coming soon" placeholder.
export default function TalentDashboard() {
  return (
    <>
      <SiteHeader />
      <main className="home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="home-icon" src="/logo.png" alt="fansonly" width={108} height={108} />
        <h1 className="logo">Talent</h1>
        <p className="tag">coming soon</p>
        <p>
          A dashboard for talent — track your shows, payouts, and fans.
          <br />
          <strong>We&apos;re building it now.</strong>
        </p>
        <p className="muted">
          Throwing or performing at shows is invite-only while we onboard a select roster.
        </p>
        <a
          className="home-invite"
          href="mailto:hello@fansonly.live?subject=fansonly%20talent%20interest"
        >
          Get on the list →
        </a>

        <div className="dash-links">
          <Link className="dash-pill" href="/dashboard">
            <strong>Promoter</strong>
            <span>Dashboard →</span>
          </Link>
          <Link className="dash-pill" href="/">
            <strong>Home</strong>
            <span>Back →</span>
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
