import Link from "next/link";

import { EventDetail, Payout, card, getJSON, money, row, rowVal } from "../_shared";

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
    <div style={{ maxWidth: 620, margin: "0 auto" }}>
      <Link href={`/dashboard/events/${id}`} style={{ color: "#161616", fontWeight: 700, fontSize: 14 }}>
        ← {event?.name ?? "Event"}
      </Link>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: "12px 0 18px", color: "#111" }}>Payouts</h1>

      <div style={card}>
        <div style={row}>
          <span style={{ color: "#333" }}>Gross revenue</span>
          <span style={rowVal}>{money(gross)}</span>
        </div>
        <div style={row}>
          <span style={{ color: "#333" }}>Production costs</span>
          <span style={rowVal}>−{money(costs)}</span>
        </div>
        {tips > 0 ? (
          <div style={row}>
            <span style={{ color: "#333" }}>Tips (to staff)</span>
            <span style={rowVal}>{money(tips)}</span>
          </div>
        ) : null}
        {typeof net === "number" ? (
          <div style={{ ...row, borderTop: "1px solid #eee", marginTop: 8, paddingTop: 12 }}>
            <span style={{ fontWeight: 700, color: "#111" }}>Net payout</span>
            <span style={{ ...rowVal, fontSize: 18 }}>{money(net)}</span>
          </div>
        ) : null}
      </div>

      <div style={{ color: "#999", fontSize: 13, margin: "4px 2px", lineHeight: 1.6 }}>
        Requesting a payout is done in the fansonly app for now.
      </div>
    </div>
  );
}
