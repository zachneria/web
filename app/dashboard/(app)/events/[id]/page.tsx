import Link from "next/link";
import type { IconType } from "react-icons";
import {
  IoCashOutline,
  IoMailOutline,
  IoPeopleOutline,
  IoPencilOutline,
  IoPricetagOutline,
  IoReceiptOutline,
  IoStarOutline,
  IoTicketOutline,
  IoTrendingUpOutline,
} from "react-icons/io5";

import { EventDetail, DetailSummary, STATUS, T, backLink, card, fmtDate, fmtTime, getJSON, money } from "./_shared";
import { DiscoverableToggle } from "./DiscoverableToggle";
import { PublishToggle } from "./PublishToggle";
import styles from "./tiles.module.css";

export const dynamic = "force-dynamic";

// Manage grid — mirrors the app's event hub. `href` present = built page; the
// rest are app-only for now (labeled "In app").
// Same Ionicons as the app's Manage grid (react-icons/io5).
const TILES: { key: string; label: string; Icon: IconType; href?: string }[] = [
  { key: "tickets", label: "Tickets", Icon: IoTicketOutline, href: "tickets" },
  { key: "guests", label: "Guests", Icon: IoPeopleOutline, href: "guests" },
  { key: "payouts", label: "Payouts", Icon: IoCashOutline, href: "payouts" },
  { key: "production", label: "Production", Icon: IoReceiptOutline, href: "production" },
  { key: "potential", label: "Potential", Icon: IoTrendingUpOutline, href: "potential" },
  { key: "discounts", label: "Discounts", Icon: IoPricetagOutline, href: "discounts" },
  { key: "passports", label: "Passports", Icon: IoStarOutline, href: "passports" },
  { key: "message", label: "Message", Icon: IoMailOutline, href: "message" },
  { key: "edit", label: "Edit", Icon: IoPencilOutline, href: "edit" },
];

export default async function EventHub({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [event, summary] = await Promise.all([
    getJSON<EventDetail>(`/events/${id}`),
    getJSON<DetailSummary>(`/events/${id}/summary`),
  ]);

  if (!event) {
    return (
      <div style={{ maxWidth: 640 }}>
        <Link href="/dashboard/events" style={backLink}>
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
    <div style={{ maxWidth: 640 }}>
      <Link href="/dashboard/events" style={backLink}>
        ← Your events
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "12px 0 2px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, margin: 0 }}>{event.name}</h1>
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
      <div style={{ color: T.muted, fontSize: 15, marginBottom: 18 }}>
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
            color: T.muted,
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
        <div style={{ height: 8, borderRadius: 4, background: T.divider, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: "#F5E642" }} />
        </div>
        <div style={{ fontSize: 12, color: T.muted, textAlign: "right", marginTop: 4 }}>{pct}% sold</div>
      </div>

      {/* Manage grid */}
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: T.muted,
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
              <div className={styles.tile} style={tileLive}>
                <t.Icon size={30} color="currentColor" />
                <span style={{ ...tileLabel, color: "inherit" }}>{t.label}</span>
              </div>
            </Link>
          ) : (
            <div key={t.key} style={tileSoon}>
              <t.Icon size={30} color="#B5B5B5" />
              <span style={tileLabel}>{t.label}</span>
              <span style={soonTag}>In app</span>
            </div>
          ),
        )}
      </div>

      {event.status !== "cancelled" ? (
        <div style={{ marginTop: 20 }}>
          <DiscoverableToggle id={event.id} discoverable={event.discoverable ?? false} />
        </div>
      ) : null}

      <div style={{ marginTop: 12 }}>
        <PublishToggle id={event.id} status={event.status} />
      </div>

      <div style={{ color: T.muted, fontSize: 13, margin: "16px 2px 0", lineHeight: 1.6 }}>
        Scanning tickets at the door, plus the &ldquo;In app&rdquo; tools above, live in the
        fansonly mobile app.
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, color: T.text }}>{value}</div>
      <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{label}</div>
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
// Live tiles: yellow-outlined on light. Border + text color live in
// tiles.module.css so the teal hover (:hover) can override them.
const tileLive: React.CSSProperties = {
  ...tileBase,
  background: "#FAFAFA",
};
// Not-yet-built ("In app") tiles stay muted grey to read as unavailable.
const tileSoon: React.CSSProperties = {
  ...tileBase,
  background: "#F4F4F2",
  border: "1px solid #E0E0E0",
};
const tileLabel: React.CSSProperties = { fontSize: 14, fontWeight: 700, color: "#9A9A9A" };
const soonTag: React.CSSProperties = {
  position: "absolute",
  top: 8,
  right: 8,
  fontSize: 10,
  fontWeight: 700,
  color: T.muted,
  background: "#ECECEA",
  border: "1px solid #DDD",
  borderRadius: 999,
  padding: "1px 6px",
};
