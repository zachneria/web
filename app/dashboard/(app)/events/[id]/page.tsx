import Link from "next/link";

import { orgFetch } from "@/lib/org-api";

export const dynamic = "force-dynamic";

interface EventDetail {
  id: string;
  name: string;
  venueName: string;
  venueAddress: string;
  eventDate: string;
  status: "draft" | "published" | "cancelled";
  capacity: number;
  description?: string;
  slug?: string | null;
}
interface DetailSummary {
  ticketsSold?: number;
  grossRevenue?: number;
  checkedIn?: number;
  ticketTypes?: { name: string; sold: number; total: number }[];
}
interface TicketType {
  id: string;
  name: string;
  category: string;
  price: string;
  quantity: number;
}
interface Guest {
  id: string;
  name: string;
  email?: string;
}
interface Cost {
  category?: string;
  description?: string;
  amount?: string | number;
  payeeName?: string | null;
}
interface Payout {
  grossRevenue?: number;
  totalCosts?: number;
  netPayout?: number;
  youKeep?: number;
  depositAmount?: number;
  costs?: Cost[];
}

const STATUS: Record<EventDetail["status"], { label: string; fg: string; bg: string }> = {
  published: { label: "Published", fg: "#1B873F", bg: "#E4F6E9" },
  draft: { label: "Draft", fg: "#6B6B6B", bg: "#EEE" },
  cancelled: { label: "Cancelled", fg: "#C0322B", bg: "#FBE6E5" },
};

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
const fmtTime = (s: string) =>
  new Date(s).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
const money = (n: unknown) => `$${Number(n ?? 0).toFixed(2)}`;

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #eee",
  borderRadius: 14,
  padding: 18,
  marginBottom: 14,
};
const sectionLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "#999",
  textTransform: "uppercase",
  letterSpacing: 0.5,
  marginBottom: 10,
};
const row: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 8,
  padding: "6px 0",
};
const rowVal: React.CSSProperties = { fontWeight: 600, color: "#222", fontVariantNumeric: "tabular-nums" };

async function getJSON<T>(path: string): Promise<T | null> {
  try {
    const r = await orgFetch(path);
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null;
  }
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [event, summary, ticketTypes, guests, payout] = await Promise.all([
    getJSON<EventDetail>(`/events/${id}`),
    getJSON<DetailSummary>(`/events/${id}/summary`),
    getJSON<TicketType[]>(`/events/${id}/ticket-types`),
    getJSON<Guest[]>(`/guests/events/${id}/guests`),
    getJSON<Payout>(`/payouts/events/${id}`),
  ]);

  if (!event) {
    return (
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
        <Link href="/dashboard/events" style={{ color: "#161616", fontWeight: 700, fontSize: 14 }}>
          ← Your events
        </Link>
        <div style={{ ...card, marginTop: 16, textAlign: "center", color: "#888" }}>
          Couldn&apos;t load this event.
        </div>
      </div>
    );
  }

  const pill = STATUS[event.status] || STATUS.draft;
  const sold = summary?.ticketsSold ?? 0;
  const cap = event.capacity || 0;
  const pct = cap > 0 ? Math.round((sold / cap) * 100) : 0;
  const admission = (ticketTypes ?? []).filter((t) => t.category === "admission");
  const addons = (ticketTypes ?? []).filter((t) => t.category !== "admission");
  const net = payout?.netPayout ?? payout?.youKeep;

  return (
    <div style={{ maxWidth: 620, margin: "0 auto" }}>
      <Link href="/dashboard/events" style={{ color: "#161616", fontWeight: 700, fontSize: 14 }}>
        ← Your events
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "12px 0 2px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111", margin: 0 }}>{event.name}</h1>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: pill.fg,
            background: pill.bg,
            borderRadius: 999,
            padding: "3px 9px",
          }}
        >
          {pill.label}
        </span>
      </div>
      <div style={{ color: "#777", fontSize: 15, marginBottom: 20 }}>
        {event.venueName} · {event.venueAddress}
        <br />
        {fmtDate(event.eventDate)} · {fmtTime(event.eventDate)}
      </div>

      {/* Sales */}
      <div style={card}>
        <div style={sectionLabel}>Ticket sales</div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 12 }}>
          <Stat label="Sold" value={sold} />
          <Stat label="Capacity" value={cap} />
          <Stat label="Revenue" value={money(summary?.grossRevenue)} />
          <Stat label="Checked in" value={summary?.checkedIn ?? 0} />
        </div>
        <div style={{ height: 8, borderRadius: 4, background: "#ECECEC", overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: "#F5E642" }} />
        </div>
        <div style={{ fontSize: 12, color: "#777", textAlign: "right", marginTop: 4 }}>{pct}% sold</div>
      </div>

      {/* Tickets */}
      <div style={card}>
        <div style={sectionLabel}>Tickets</div>
        {admission.length === 0 && addons.length === 0 ? (
          <div style={{ color: "#999", fontSize: 14 }}>No ticket types yet.</div>
        ) : (
          <>
            {[...admission, ...addons].map((t) => {
              const s = summary?.ticketTypes?.find((x) => x.name === t.name);
              return (
                <div key={t.id} style={row}>
                  <span style={{ color: "#333" }}>
                    {t.name}{" "}
                    <span style={{ color: "#aaa", fontSize: 13 }}>· {money(t.price)}</span>
                    {t.category !== "admission" ? (
                      <span style={{ color: "#aaa", fontSize: 12 }}> · {t.category}</span>
                    ) : null}
                  </span>
                  <span style={rowVal}>
                    {s ? `${s.sold} / ${s.total}` : `— / ${t.quantity}`}
                  </span>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Guests */}
      <div style={card}>
        <div style={sectionLabel}>Guests ({guests?.length ?? 0})</div>
        {!guests || guests.length === 0 ? (
          <div style={{ color: "#999", fontSize: 14 }}>No guest passes.</div>
        ) : (
          guests.map((g) => (
            <div key={g.id} style={row}>
              <span style={{ color: "#333" }}>{g.name}</span>
              {g.email ? <span style={{ color: "#999", fontSize: 13 }}>{g.email}</span> : null}
            </div>
          ))
        )}
      </div>

      {/* Production & payout */}
      <div style={card}>
        <div style={sectionLabel}>Production &amp; payout</div>
        <div style={row}>
          <span style={{ color: "#333" }}>Gross revenue</span>
          <span style={rowVal}>{money(payout?.grossRevenue ?? summary?.grossRevenue)}</span>
        </div>
        {payout?.costs && payout.costs.length > 0 ? (
          <>
            <div style={{ ...sectionLabel, marginTop: 10, marginBottom: 6 }}>Costs</div>
            {payout.costs.map((c, i) => (
              <div key={i} style={row}>
                <span style={{ color: "#333" }}>
                  {c.description || c.category || "Cost"}
                  {c.payeeName ? <span style={{ color: "#aaa", fontSize: 13 }}> · {c.payeeName}</span> : null}
                </span>
                <span style={rowVal}>{money(c.amount)}</span>
              </div>
            ))}
          </>
        ) : (
          <div style={{ color: "#999", fontSize: 14, padding: "6px 0" }}>No production costs added.</div>
        )}
        {typeof net === "number" ? (
          <div style={{ ...row, borderTop: "1px solid #eee", marginTop: 8, paddingTop: 12 }}>
            <span style={{ fontWeight: 700, color: "#111" }}>Net payout</span>
            <span style={{ ...rowVal, fontSize: 17 }}>{money(net)}</span>
          </div>
        ) : null}
      </div>

      {event.description ? (
        <div style={card}>
          <div style={sectionLabel}>About</div>
          <div style={{ color: "#333", fontSize: 15, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
            {event.description}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "#111" }}>{value}</div>
      <div style={{ fontSize: 12, color: "#777", marginTop: 2 }}>{label}</div>
    </div>
  );
}
