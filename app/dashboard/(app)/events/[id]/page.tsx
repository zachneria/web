import Link from "next/link";

import { EventDetail, DetailSummary, STATUS, card, fmtDate, fmtTime, getJSON, money } from "./_shared";
import { PublishToggle } from "./PublishToggle";

export const dynamic = "force-dynamic";

// Manage grid — mirrors the app's event hub. `href` present = built page; the
// rest are app-only for now (labeled "In app").
const TILES: { key: string; label: string; icon: string; href?: string }[] = [
  { key: "tickets", label: "Tickets", icon: "🎟️", href: "tickets" },
  { key: "guests", label: "Guests", icon: "👥", href: "guests" },
  { key: "payouts", label: "Payouts", icon: "💵", href: "payouts" },
  { key: "production", label: "Production", icon: "🧾", href: "production" },
  { key: "potential", label: "Potential", icon: "📈" },
  { key: "discounts", label: "Discounts", icon: "🏷️" },
  { key: "passports", label: "Passports", icon: "⭐" },
  { key: "message", label: "Message", icon: "✉️" },
  { key: "edit", label: "Edit", icon: "✏️", href: "edit" },
];

export default async function EventHub({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [event, summary] = await Promise.all([
    getJSON<EventDetail>(`/events/${id}`),
    getJSON<DetailSummary>(`/events/${id}/summary`),
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
      <div style={{ color: "#777", fontSize: 15, marginBottom: 18 }}>
        {event.venueName} · {event.venueAddress}
        <br />
        {fmtDate(event.eventDate)} · {fmtTime(event.eventDate)}
      </div>

      {/* Ticket sales */}
      <div style={card}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#999",
            textTransform: "uppercase",
            letterSpacing: 0.5,
            marginBottom: 10,
          }}
        >
          Ticket sales
        </div>
        <div style={{ display: "flex", gap: 22, flexWrap: "wrap", marginBottom: 12 }}>
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

      {/* Manage grid */}
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#999",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          margin: "18px 2px 10px",
        }}
      >
        Manage
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {TILES.map((t) =>
          t.href ? (
            <Link key={t.key} href={`/dashboard/events/${id}/${t.href}`} style={tileLink}>
              <div style={tileLive}>
                <span style={{ fontSize: 26 }}>{t.icon}</span>
                <span style={tileLabel}>{t.label}</span>
              </div>
            </Link>
          ) : (
            <div key={t.key} style={tileSoon}>
              <span style={{ fontSize: 26 }}>{t.icon}</span>
              <span style={tileLabel}>{t.label}</span>
              <span style={soonTag}>In app</span>
            </div>
          ),
        )}
      </div>

      <div style={{ marginTop: 20 }}>
        <PublishToggle id={event.id} status={event.status} />
      </div>

      <div style={{ color: "#999", fontSize: 13, margin: "16px 2px 0", lineHeight: 1.6 }}>
        Scanning tickets at the door, plus the &ldquo;In app&rdquo; tools above, live in the
        fansonly mobile app.
      </div>
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

const tileLink: React.CSSProperties = { textDecoration: "none", color: "inherit" };
const tileBase: React.CSSProperties = {
  position: "relative",
  borderRadius: 16,
  minHeight: 96,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};
// Live tiles = brand yellow so they stand out on the off-white page.
const tileLive: React.CSSProperties = {
  ...tileBase,
  background: "#F5E642",
  border: "1px solid #E4D400",
};
// Not-yet-built ("In app") tiles stay muted grey to read as unavailable.
const tileSoon: React.CSSProperties = {
  ...tileBase,
  background: "#F0F0F0",
  border: "1px solid #E5E5E5",
  opacity: 0.7,
};
const tileLabel: React.CSSProperties = { fontSize: 14, fontWeight: 700, color: "#161616" };
const soonTag: React.CSSProperties = {
  position: "absolute",
  top: 8,
  right: 8,
  fontSize: 10,
  fontWeight: 700,
  color: "#999",
  background: "#fff",
  border: "1px solid #e5e5e5",
  borderRadius: 999,
  padding: "1px 6px",
};
