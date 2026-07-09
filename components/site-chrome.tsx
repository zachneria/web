import Link from "next/link";

// Shared branded header + footer so the event and promoter pages feel like one
// cohesive fansonly experience (the homepage stays bespoke).
export function SiteHeader({
  logo = true,
  wordmark = true,
  signIn = false,
}: {
  logo?: boolean;
  wordmark?: boolean;
  signIn?: boolean; // top-right Sign in (marketing pages only — buyers have no accounts)
}) {
  return (
    <header className="topbar">
      <div className="topbar-inner topbar-inner-spread">
        {(logo || wordmark) && (
          <Link href="/" className="topbar-brand">
            {logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/logo.png" alt="" className="topbar-logo" />
            )}
            {wordmark && <span className="topbar-word">fansonly</span>}
          </Link>
        )}
        <nav className="topbar-nav">
          <Link href="/events" className="topbar-find">
            Find events
          </Link>
          {signIn && (
            <Link href="/dashboard" className="topbar-signin">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <span className="footer-word">fansonly</span>
        <span className="footer-tag">Built for promoters and scene makers</span>
        <span className="footer-links">
          <Link href="/pricing">Pricing</Link>
          {" · "}
          <Link href="/terms">Terms</Link>
          {" · "}
          <Link href="/privacy">Privacy</Link>
        </span>
      </div>
    </footer>
  );
}
