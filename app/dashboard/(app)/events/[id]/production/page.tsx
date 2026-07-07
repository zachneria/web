import Link from "next/link";

import { EventDetail, Payout, card, getJSON, money, row, rowVal } from "../_shared";
import { CostAddForm } from "./CostAddForm";

export const dynamic = "force-dynamic";

export default async function ProductionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [event, payout] = await Promise.all([
    getJSON<EventDetail>(`/events/${id}`),
    getJSON<Payout>(`/payouts/events/${id}`),
  ]);
  const costs = payout?.costs ?? [];
  const total = costs.reduce((n, c) => n + Number(c.amount ?? 0), 0);

  return (
    <div style={{ maxWidth: 620, margin: "0 auto" }}>
      <Link href={`/dashboard/events/${id}`} style={{ color: "#F5E642", fontWeight: 700, fontSize: 14 }}>
        ← {event?.name ?? "Event"}
      </Link>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: "12px 0 18px", color: "#F2F2F2" }}>Production</h1>

      <CostAddForm eventId={id} />

      <div style={card}>
        {costs.length === 0 ? (
          <div style={{ color: "#8F8F8F" }}>No production costs yet — add one above.</div>
        ) : (
          <>
            {costs.map((c, i) => (
              <div key={i} style={row}>
                <span style={{ color: "#D8D8D8" }}>
                  {c.description || c.category || "Cost"}
                  {c.payeeName ? (
                    <span style={{ color: "#8F8F8F", fontSize: 13 }}> · {c.payeeName}</span>
                  ) : null}
                </span>
                <span style={rowVal}>{money(c.amount)}</span>
              </div>
            ))}
            <div style={{ ...row, borderTop: "1px solid #2A2A2A", marginTop: 8, paddingTop: 12 }}>
              <span style={{ fontWeight: 700, color: "#F2F2F2" }}>Total costs</span>
              <span style={{ ...rowVal, fontSize: 16 }}>{money(total)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
