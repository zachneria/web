import Link from "next/link";

import {
  DetailSummary,
  EventDetail,
  Payout,
  TicketType,
  card,
  getJSON,
  money,
  row,
  rowVal,
} from "../_shared";

export const dynamic = "force-dynamic";

export default async function PotentialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [event, types, summary, payout] = await Promise.all([
    getJSON<EventDetail>(`/events/${id}`),
    getJSON<TicketType[]>(`/events/${id}/ticket-types`),
    getJSON<DetailSummary>(`/events/${id}/summary`),
    getJSON<Payout>(`/payouts/events/${id}`),
  ]);

  const admission = (types ?? []).filter((t) => t.category === "admission");
  // Sell-out potential = every admission tier's price × its quantity.
  const maxGross = admission.reduce((n, t) => n + Number(t.price) * (t.quantity || 0), 0);
  const costs = payout?.totalCosts ?? (payout?.costs ?? []).reduce((n, c) => n + Number(c.amount ?? 0), 0);
  const potentialNet = maxGross - costs;
  const currentRevenue = summary?.grossRevenue ?? 0;
  const sold = summary?.ticketsSold ?? 0;
  const cap = event?.capacity ?? 0;

  return (
    <div style={{ maxWidth: 620, margin: "0 auto" }}>
      <Link href={`/dashboard/events/${id}`} style={{ color: "#F5E642", fontWeight: 700, fontSize: 14 }}>
        ← {event?.name ?? "Event"}
      </Link>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: "12px 0 4px", color: "#F2F2F2" }}>Potential</h1>
      <p style={{ color: "#8F8F8F", fontSize: 14, margin: "0 0 18px" }}>
        If every admission ticket sells.
      </p>

      <div style={card}>
        <div style={row}>
          <span style={{ color: "#D8D8D8" }}>Sold so far</span>
          <span style={rowVal}>
            {sold} / {cap}
          </span>
        </div>
        <div style={row}>
          <span style={{ color: "#D8D8D8" }}>Revenue so far</span>
          <span style={rowVal}>{money(currentRevenue)}</span>
        </div>
      </div>

      <div style={{ ...card, background: "#161616", border: "1px solid #2E2E2E" }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#8a8a8a",
            textTransform: "uppercase",
            letterSpacing: 0.5,
            marginBottom: 10,
          }}
        >
          If sold out
        </div>
        <div style={row}>
          <span style={{ color: "#cfcfcf" }}>Gross (all admission)</span>
          <span style={{ ...rowVal, color: "#fff" }}>{money(maxGross)}</span>
        </div>
        <div style={row}>
          <span style={{ color: "#cfcfcf" }}>Production costs</span>
          <span style={{ ...rowVal, color: "#fff" }}>−{money(costs)}</span>
        </div>
        <div style={{ ...row, borderTop: "1px solid #333", marginTop: 8, paddingTop: 12 }}>
          <span style={{ fontWeight: 700, color: "#fff" }}>Potential net</span>
          <span style={{ ...rowVal, color: "#F5E642", fontSize: 18 }}>{money(potentialNet)}</span>
        </div>
      </div>

      {admission.length > 0 ? (
        <div style={card}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#8F8F8F",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            By tier (at capacity)
          </div>
          {admission.map((t) => (
            <div key={t.id} style={row}>
              <span style={{ color: "#D8D8D8" }}>
                {t.name} <span style={{ color: "#8F8F8F", fontSize: 13 }}>· {money(t.price)} × {t.quantity}</span>
              </span>
              <span style={rowVal}>{money(Number(t.price) * (t.quantity || 0))}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
