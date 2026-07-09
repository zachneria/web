import type { Metadata } from "next";

import { SiteFooter, SiteHeader } from "@/components/site-chrome";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Pricing — fansonly vs Eventbrite & Ticketmaster",
  description:
    "One flat $3 fee per ticket. Organizers keep 100% of face value. See exactly how fansonly compares to Eventbrite and Ticketmaster on a $20–$40 show.",
};

const INVITE = "mailto:hello@fansonly.live?subject=fansonly%20invite%20request";

// Fee math (US). Buyer-facing total on a face-value ticket.
// fansonly: flat $3 buyer fee; organizer keeps 100% of face (we absorb card processing).
// Eventbrite: 3.7% + $1.79 service + 2.9% payment processing, passed to the buyer.
// Ticketmaster: notoriously opaque stacked fees (service + facility + processing),
//   commonly 20–30%+ and only revealed at checkout — illustrated here at ~28%.
const PRICES = [20, 30, 40];
const foBuyer = (face: number) => face + 3;
const ebBuyer = (face: number) => {
  const service = 0.037 * face + 1.79;
  return face + service + 0.029 * (face + service);
};
const tmBuyer = (face: number) => face * 1.28;
const money = (n: number) => `$${n.toFixed(2)}`;

const COMPARE: { label: string; fo: string; eb: string; tm: string }[] = [
  { label: "Fee your fans pay", fo: "$3 flat, per ticket", eb: "3.7% + $1.79 + 2.9% processing", tm: "20–30%+ stacked" },
  { label: "What the organizer keeps", fo: "100% of face value", eb: "Face — or −~15% if you absorb fees", tm: "Reduced by fees & holds" },
  { label: "Fees shown", fo: "Upfront, always", eb: "Added at checkout", tm: "Revealed at checkout" },
  { label: "Buyer needs an account", fo: "No — tap the link, done", eb: "Yes", tm: "Yes" },
  { label: "Sell from a link", fo: "Yes", eb: "Limited", tm: "No" },
  { label: "Payout", fo: "After the show, to your bank", eb: "Varies", tm: "Varies / delayed" },
];

export default function Pricing() {
  return (
    <div className={styles.page}>
      <SiteHeader signIn />

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>Honest pricing</span>
          <h1 className={styles.h1}>
            One fee. <em>$3.</em> That&apos;s it.
          </h1>
          <p className={styles.sub}>
            No percentage games, no facility fees, no surprises at checkout. Your fans pay a
            flat $3 per ticket — and you keep 100% of your face value. Here&apos;s exactly how
            that stacks up against the big guys.
          </p>
        </div>
      </section>

      {/* The one number */}
      <section className={styles.section}>
        <div className={styles.bigNumberRow}>
          <div className={styles.bigNumberCard}>
            <div className={styles.bigNumber}>$3</div>
            <div className={styles.bigNumberLabel}>flat, per ticket — paid by the fan</div>
          </div>
          <div className={styles.bigNumberCard}>
            <div className={styles.bigNumber}>100%</div>
            <div className={styles.bigNumberLabel}>of face value stays with you</div>
          </div>
          <div className={styles.bigNumberCard}>
            <div className={styles.bigNumber}>$0</div>
            <div className={styles.bigNumberLabel}>hidden fees, ever</div>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className={styles.section}>
        <p className={styles.kicker}>Head to head</p>
        <h2 className={styles.h2}>How we compare</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.rowHead}></th>
                <th className={styles.foCol}>fansonly</th>
                <th>Eventbrite</th>
                <th>Ticketmaster</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((r) => (
                <tr key={r.label}>
                  <td className={styles.rowHead}>{r.label}</td>
                  <td className={styles.foCell}>{r.fo}</td>
                  <td>{r.eb}</td>
                  <td>{r.tm}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Breakdown */}
      <section className={styles.section}>
        <p className={styles.kicker}>The real math</p>
        <h2 className={styles.h2}>What your fans actually pay</h2>
        <p className={styles.sectionSub}>
          Same ticket, three platforms — the total a fan taps &ldquo;pay&rdquo; on.
        </p>
        <div className={styles.breakdownGrid}>
          {PRICES.map((face) => (
            <div key={face} className={styles.breakdownCard}>
              <div className={styles.faceTag}>${face} ticket</div>
              <div className={`${styles.payRow} ${styles.payWin}`}>
                <span>fansonly</span>
                <strong>{money(foBuyer(face))}</strong>
              </div>
              <div className={styles.payRow}>
                <span>Eventbrite</span>
                <strong>{money(ebBuyer(face))}</strong>
              </div>
              <div className={styles.payRow}>
                <span>Ticketmaster*</span>
                <strong>{money(tmBuyer(face))}</strong>
              </div>
              <div className={styles.keepNote}>You keep the full ${face}</div>
            </div>
          ))}
        </div>
        <p className={styles.footnote}>
          fansonly: face value + $3 flat. Eventbrite: 3.7% + $1.79 service + 2.9% processing,
          passed to the buyer. *Ticketmaster fees are stacked (service + facility + processing),
          commonly 20–30%+ and shown only at checkout — illustrated here at ~28%. US pricing,
          single-ticket order.
        </p>
      </section>

      {/* Target price band */}
      <section className={styles.bandWrap}>
        <div className={styles.band}>
          <p className={styles.kicker} style={{ color: "#8a8a8a" }}>
            Built for the room
          </p>
          <h2 className={styles.h2}>The sweet spot: $15–$50 shows</h2>
          <p className={styles.sectionSub}>
            A flat $3 is the best deal in the club space price range — where percentage fees
            quietly pile up. On a $30 door, a percentage platform skims more than double our fee.
            Bigger the ticket, bigger your edge.
          </p>
          <div className={styles.bandRange}>
            <span>$15</span>
            <div className={styles.bandTrack}>
              <div className={styles.bandFill} />
            </div>
            <span>$50</span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.section} style={{ textAlign: "center" }}>
        <h2 className={styles.h2}>Keep the money. Run the show.</h2>
        <a className={styles.btnPrimary} href={INVITE}>
          Request an invite →
        </a>
      </section>

      <SiteFooter />
    </div>
  );
}
