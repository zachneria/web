import type { IconType } from "react-icons";
import {
  IoCardOutline,
  IoCashOutline,
  IoHeadsetOutline,
  IoHeartOutline,
  IoLinkOutline,
  IoLockClosedOutline,
  IoMegaphoneOutline,
  IoMicOutline,
  IoPeopleOutline,
  IoPersonOutline,
  IoPricetagOutline,
  IoScanOutline,
  IoStatsChartOutline,
  IoWalletOutline,
  IoWineOutline,
} from "react-icons/io5";

import { SiteFooter, SiteHeader } from "@/components/site-chrome";

import styles from "./page.module.css";

const INVITE = "mailto:hello@shabanga.com?subject=shabanga%20invite%20request";

// Public beta install links. iOS = TestFlight public link (stable). Android =
// EAS internal-distribution build page (changes per build — re-point on rebuild;
// null until the current APK build finishes → renders "Coming soon").
const IOS_BETA_URL = "https://testflight.apple.com/join/g93ysYca";
const ANDROID_BETA_URL: string | null =
  "https://expo.dev/accounts/zneria/projects/fo-app/builds/3f508b76-d8ce-48ae-9a12-5f5532ab06c8";

const FEATURES: { Icon: IconType; title: string; body: string }[] = [
  { Icon: IoLinkOutline, title: "Sell from a link", body: "One share link — text it, post it, drop it in a group chat. Buyers tap and check out." },
  { Icon: IoCashOutline, title: "Minimal, honest fees", body: "Way less than the big guys. What you price is what your fans pay — no surprise add-ons." },
  { Icon: IoPersonOutline, title: "No buyer account", body: "Fans never sign up. Tap the link, grab the ticket, done." },
  { Icon: IoScanOutline, title: "Door check-in", body: "Scan tickets at the door from your phone — plus name search for the list." },
  { Icon: IoStatsChartOutline, title: "Live sales", body: "Watch sold, checked-in, and revenue update in real time, per tier." },
  { Icon: IoCardOutline, title: "Fast payouts", body: "Connect your bank and cash out after the show. Powered by Stripe." },
  { Icon: IoPricetagOutline, title: "Discount codes", body: "Shared or unique-batch codes, % or $ off, caps and expiries." },
  { Icon: IoPeopleOutline, title: "Guest & comp passes", body: "Add guests and plus-ones without burning inventory." },
  { Icon: IoWineOutline, title: "In-app drink & merch", body: "Sell drink and merch passes that unlock at the bar once fans check in." },
  { Icon: IoMegaphoneOutline, title: "Email & SMS blasts", body: "Message your buyers about new shows and last-chance tickets, with AI drafting." },
  { Icon: IoWalletOutline, title: "Apple Wallet", body: "Every ticket adds to Apple Wallet — and lives in the app as a backup." },
  { Icon: IoLockClosedOutline, title: "Anti-scalp by design", body: "Passes stay in the app so they can't be screenshotted, forwarded, or resold." },
];

export default function Home() {
  return (
    <div className={styles.page}>
      <SiteHeader signIn />

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>Independent event ticketing</span>
          <h1 className={styles.h1}>
            Sell out the show. <em>Keep the money.</em>
          </h1>
          <p className={styles.sub}>
            shabanga is ticketing built for promoters and creators — minimal fees, sell
            straight from a link, and your buyers never need an account.
          </p>
          <div className={styles.ctaRow}>
            <a className={styles.btnPrimary} href={INVITE}>
              Request an invite →
            </a>
            <a className={styles.btnGhost} href="/pricing">
              See our pricing
            </a>
            <a className={styles.btnGhost} href="/dashboard">
              Promoter login
            </a>
            <a className={`${styles.btnGhost} ${styles.btnGhostArtist}`} href="/dashboard">
              Artist login
            </a>
          </div>
          <div className={styles.valueStrip}>
            <span>Minimal fees</span>
            <span>Sell from a link</span>
            <span>No buyer account</span>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className={styles.section}>
        <p className={styles.kicker}>Who it&apos;s for</p>
        <h2 className={styles.h2}>Built for the whole night</h2>
        <div className={styles.audience}>
          <div className={`${styles.audienceCard} ${styles.dark}`}>
            <div className={styles.audEmoji}><IoHeadsetOutline size={36} color="#F5E642" /></div>
            <div className={styles.audTitle}>Promoters &amp; creators</div>
            <p className={styles.audBody}>
              Throw the event — we handle the rest. Create in minutes, sell from one link,
              scan tickets at the door from your phone, run discounts and guest lists, and
              cash out after the show.
            </p>
          </div>
          <div className={`${styles.audienceCard} ${styles.dark}`}>
            <div className={styles.audEmoji}><IoHeartOutline size={36} color="#F5E642" /></div>
            <div className={styles.audTitle}>Fans &amp; buyers</div>
            <p className={styles.audBody}>
              Tap a link, grab your ticket — no account, no forced app download. Keep tickets
              in Apple Wallet and the app, and unlock drink &amp; merch passes at the bar once
              you&apos;re checked in.
            </p>
          </div>
          <div className={`${styles.audienceCard} ${styles.dark}`}>
            <div className={styles.audEmoji}><IoMicOutline size={36} color="#F5E642" /></div>
            <div className={styles.audTitle}>Talent</div>
            <p className={styles.audBody}>
              Your own gig page with a playable mix, get booked straight from it, and get
              paid — with your rate history built automatically from every show.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.featuresWrap}>
        <div className={styles.section}>
          <p className={styles.kicker}>Everything you need</p>
          <h2 className={styles.h2}>One platform, door to payout</h2>
          <div className={styles.features}>
            {FEATURES.map((f) => (
              <div key={f.title} className={styles.feature}>
                <div className={styles.featureIcon}>
                  <f.Icon size={26} color="#1A1E38" />
                </div>
                <div className={styles.featureTitle}>{f.title}</div>
                <p className={styles.featureBody}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className={styles.section}>
        <p className={styles.kicker}>How it works</p>
        <h2 className={styles.h2}>Live in three steps</h2>
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepNum}>1</div>
            <div className={styles.stepTitle}>Create your event</div>
            <p className={styles.stepBody}>
              Add the details, set your tiers and prices — or paste a flyer and let AI fill it
              in. Publish in minutes.
            </p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNum}>2</div>
            <div className={styles.stepTitle}>Share your link</div>
            <p className={styles.stepBody}>
              Drop one link anywhere. Fans buy in a few taps — no sign-up, on web or in the
              app.
            </p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNum}>3</div>
            <div className={styles.stepTitle}>Get paid</div>
            <p className={styles.stepBody}>
              Scan tickets at the door, track sales live, and cash out to your bank after the
              show.
            </p>
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className={styles.ctaBand}>
        <p className={styles.kicker} style={{ color: "#8a8a8a" }}>
          Invite-only for now
        </p>
        <h2 className={styles.h2}>Ready to run your next show?</h2>
        <a className={styles.btnPrimary} href={INVITE}>
          Request an invite →
        </a>
        <div className={styles.stores}>
          <a
            className={`${styles.storePill} ${styles.storePillLive}`}
            href={IOS_BETA_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <strong>iOS Beta</strong>
            Join on TestFlight →
          </a>
          {ANDROID_BETA_URL ? (
            <a
              className={`${styles.storePill} ${styles.storePillLive}`}
              href={ANDROID_BETA_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <strong>Android Beta</strong>
              Install the APK →
            </a>
          ) : (
            <span className={styles.storePill}>
              <strong>Android Beta</strong>
              Coming soon
            </span>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
