import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export default function Home() {
  return (
    <>
      <SiteHeader logo={false} wordmark={false} />
      <main className="home">
        <img className="home-icon" src="/logo.png" alt="fansonly" width={108} height={108} />
        <h1 className="logo">fansonly</h1>
        <p className="tag">built for promoters and scene makers</p>
        <p>
          Got a link to a show? Open it and grab your tickets — no account needed.
          <br />
          <strong>Tickets are open to everyone.</strong>
        </p>
        <p className="muted">
          Throwing shows is <strong>invite-only</strong> — we onboard a select roster
          of promoters.
        </p>
        <p className="home-pitch">
          Cheaper ticket fees, better platform, built for producers and promoters.
        </p>
        <a
          className="home-invite"
          href="mailto:hello@fansonly.live?subject=fansonly%20invite%20request"
        >
          Request an invite →
        </a>

        <div className="stores">
          <span className="store-pill">
            <strong>App Store</strong>
            <span>Coming soon</span>
          </span>
          <span className="store-pill">
            <strong>Google Play</strong>
            <span>Coming soon</span>
          </span>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
