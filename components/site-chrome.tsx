import Link from "next/link";

// Shared branded header + footer so the event and promoter pages feel like one
// cohesive fansonly experience (the homepage stays bespoke).
export function SiteHeader() {
  return (
    <header className="topbar">
      <Link href="/" className="topbar-brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" className="topbar-logo" />
        <span className="topbar-word">fansonly</span>
      </Link>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="footer">
      <span className="footer-word">fansonly</span>
      <span className="footer-tag">Built for promoters and scene makers</span>
    </footer>
  );
}
