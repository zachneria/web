import Link from "next/link";

// Shared branded header + footer so the event and promoter pages feel like one
// cohesive fansonly experience (the homepage stays bespoke).
export function SiteHeader({
  logo = true,
  wordmark = true,
}: {
  logo?: boolean;
  wordmark?: boolean;
}) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        {(logo || wordmark) && (
          <Link href="/" className="topbar-brand">
            {logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/logo.png" alt="" className="topbar-logo" />
            )}
            {wordmark && <span className="topbar-word">fansonly</span>}
          </Link>
        )}
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
      </div>
    </footer>
  );
}
