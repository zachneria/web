import Link from "next/link";

import { TipsRail, type Tip } from "../../../TipsRail";
import { EventDetail, Payout, card, getJSON, money, row, rowVal } from "../_shared";

const PAYOUT_TIPS: Tip[] = [
  {
    key: "after-show",
    title: "Money moves after the show",
    body: "Ticket revenue is held until your event ends — then Request Payout sends it to your bank. Safer for refunds if anything changes.",
  },
  {
    key: "what-you-get",
    title: "What actually transfers",
    body: "Gross ticket sales minus the platform fee (shows under 50 tickets are free). Production costs are NOT deducted — you pay your people directly from the Production screen.",
  },
  {
    key: "tips-passthrough",
    title: "Tips pass through to staff",
    body: "Drink tips are collected with orders and added to your transfer in full — never fee'd, earmarked for your staff.",
  },
  {
    key: "connect",
    title: "Connect your bank first",
    body: "Request Payout needs your Stripe payout account connected.",
    href: "/dashboard/account-settings",
    cta: "Check payout status",
  },
];

export const dynamic = "force-dynamic";

export default async function PayoutsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [event, payout] = await Promise.all([
    getJSON<EventDetail>(`/events/${id}`),
    getJSON<Payout>(`/payouts/events/${id}`),
  ]);

  const gross = payout?.grossRevenue ?? 0;
  const costs = payout?.totalCosts ?? (payout?.costs ?? []).reduce((n, c) => n + Number(c.amount ?? 0), 0);
  const tips = payout?.tipsCollected ?? 0;
  const net = payout?.netPayout ?? payout?.youKeep;

  return (
    <div className="dsh-content-row">
      <div className="dsh-content-main" style={{ maxWidth: 640 }}>
      <Link href={`/dashboard/events/${id}`} style={{ color: "#0B8896", fontWeight: 700, fontSize: 14 }}>
        ← {event?.name ?? "Event"}
      </Link>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: "12px 0 18px", color: "#111111" }}>Payouts</h1>

      <div style={card}>
        <div style={row}>
          <span style={{ color: "#333333" }}>Gross revenue</span>
          <span style={rowVal}>{money(gross)}</span>
        </div>
        <div style={row}>
          <span style={{ color: "#333333" }}>Production costs</span>
          <span style={rowVal}>−{money(costs)}</span>
        </div>
        {tips > 0 ? (
          <div style={row}>
            <span style={{ color: "#333333" }}>Tips (to staff)</span>
            <span style={rowVal}>{money(tips)}</span>
          </div>
        ) : null}
        {typeof net === "number" ? (
          <div style={{ ...row, borderTop: "1px solid #ECECEC", marginTop: 8, paddingTop: 12 }}>
            <span style={{ fontWeight: 700, color: "#111111" }}>Net payout</span>
            <span style={{ ...rowVal, fontSize: 18 }}>{money(net)}</span>
          </div>
        ) : null}
      </div>

      <div style={{ color: "#8A8A8A", fontSize: 13, margin: "4px 2px", lineHeight: 1.6 }}>
        Requesting a payout is done in the shabanga app for now.
      </div>
      </div>
      <TipsRail tips={PAYOUT_TIPS} title="Good to know" />
    </div>
  );
}
