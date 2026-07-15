import Link from "next/link";

import {
  DetailSummary,
  EventDetail,
  TicketType,
  card,
  getJSON,
  money,
  row,
  rowVal,
} from "../_shared";
import { TipsRail, type Tip } from "../../../TipsRail";
import { AddTicketForm } from "./AddTicketForm";

// How ticket types actually behave — the non-obvious rules organizers ask
// about. Static (always shown on this page).
const TICKET_TIPS: Tip[] = [
  {
    key: "drinks-gate",
    title: "Drinks & credits unlock at the door",
    body: "Drink and credit tickets only become buyable in the app AFTER a customer is scanned in — buyers won't see them until they're checked in at your event.",
  },
  {
    key: "tier-ladder",
    title: "Tiers open in price order",
    body: "Fixed-price admission tiers form a ladder: only the cheapest tier with stock is on sale, and the next opens automatically when it sells out.",
  },
  {
    key: "fee",
    title: "Who pays the booking fee",
    body: "Each admission ticket adds the buyer fee at checkout. Check “I'll cover the booking fee” on a type and buyers pay face value instead.",
  },
  {
    key: "order-cap",
    title: "Max 20 per order",
    body: "Buyers can grab at most 20 of any ticket type in one order. Bigger groups just check out twice — it's a fraud guard, not a per-person limit.",
  },
  {
    key: "sales-close",
    title: "Sales close automatically",
    body: "All sales — admission, drinks, and credits — stop when your event ends. You can also stop any single item early (or close the whole bar) from the app's ticket editor.",
  },
];

export const dynamic = "force-dynamic";

export default async function TicketsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [event, types, summary] = await Promise.all([
    getJSON<EventDetail>(`/events/${id}`),
    getJSON<TicketType[]>(`/events/${id}/ticket-types`),
    getJSON<DetailSummary>(`/events/${id}/summary`),
  ]);

  const admission = (types ?? []).filter((t) => t.category === "admission");
  const addons = (types ?? []).filter((t) => t.category !== "admission");

  return (
    <div className="dsh-content-row">
      <div className="dsh-content-main" style={{ maxWidth: 640 }}>
      <Link href={`/dashboard/events/${id}`} style={{ color: "#0B8896", fontWeight: 700, fontSize: 14 }}>
        {event?.name ?? "Event"}
      </Link>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: "12px 0 18px", color: "#161616" }}>Tickets</h1>

      {event && admission.reduce((n, t) => n + t.quantity, 0) > event.capacity ? (
        <div
          style={{
            background: "#FFF3C2",
            border: "none",
            borderRadius: 12,
            padding: "12px 14px",
            marginBottom: 14,
            fontSize: 13,
            color: "#6B5500",
            lineHeight: 1.5,
          }}
        >
          Your admission tiers total{" "}
          <strong>{admission.reduce((n, t) => n + t.quantity, 0)}</strong> tickets, but capacity
          is <strong>{event.capacity}</strong> — only {event.capacity} can ever sell. Trim a tier
          or raise capacity in Edit.
        </div>
      ) : null}

      <AddTicketForm eventId={id} />

      {!types || types.length === 0 ? (
        <div style={{ ...card, color: "#8A8A8A" }}>No ticket types yet — add one above.</div>
      ) : (
        <>
          <Section title="Admission" items={admission} summary={summary} />
          {addons.length > 0 ? <Section title="Add-ons" items={addons} summary={summary} /> : null}
        </>
      )}
      </div>
      <TipsRail tips={TICKET_TIPS} title="Good to know" />
    </div>
  );
}

function Section({
  title,
  items,
  summary,
}: {
  title: string;
  items: TicketType[];
  summary: DetailSummary | null;
}) {
  if (items.length === 0) return null;
  return (
    <div style={card}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#8A8A8A",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      {items.map((t) => {
        const s = summary?.ticketTypes?.find((x) => x.name === t.name);
        return (
          <div key={t.id} style={row}>
            <span style={{ color: "#333333" }}>
              {t.name} <span style={{ color: "#8A8A8A", fontSize: 13 }}>· {money(t.price)}</span>
              {t.category !== "admission" ? (
                <span style={{ color: "#8A8A8A", fontSize: 12 }}> · {t.category}</span>
              ) : null}
            </span>
            <span style={rowVal}>{s ? `${s.sold} / ${s.total}` : `0 / ${t.quantity}`}</span>
          </div>
        );
      })}
    </div>
  );
}
