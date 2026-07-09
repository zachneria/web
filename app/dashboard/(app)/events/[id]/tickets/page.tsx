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
import { AddTicketForm } from "./AddTicketForm";

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
    <div style={{ maxWidth: 640 }}>
      <Link href={`/dashboard/events/${id}`} style={{ color: "#0B8896", fontWeight: 700, fontSize: 14 }}>
        ← {event?.name ?? "Event"}
      </Link>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: "12px 0 18px", color: "#111111" }}>Tickets</h1>

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
