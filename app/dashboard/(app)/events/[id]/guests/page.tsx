import Link from "next/link";

import { EventDetail, Guest, card, getJSON, row } from "../_shared";
import { GuestAddForm } from "./GuestAddForm";

export const dynamic = "force-dynamic";

export default async function GuestsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [event, guests] = await Promise.all([
    getJSON<EventDetail>(`/events/${id}`),
    getJSON<Guest[]>(`/guests/events/${id}/guests`),
  ]);

  return (
    <div style={{ maxWidth: 640 }}>
      <Link href={`/dashboard/events/${id}`} style={{ color: "#0B8896", fontWeight: 700, fontSize: 14 }}>
        ← {event?.name ?? "Event"}
      </Link>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: "12px 0 18px", color: "#111111" }}>
        Guests {guests && guests.length > 0 ? `(${guests.length})` : ""}
      </h1>

      <GuestAddForm eventId={id} />

      <div style={card}>
        {!guests || guests.length === 0 ? (
          <div style={{ color: "#8A8A8A" }}>No guest passes yet — add one above.</div>
        ) : (
          guests.map((g) => (
            <div key={g.id} style={row}>
              <span style={{ color: "#333333" }}>{g.name}</span>
              {g.email ? <span style={{ color: "#8A8A8A", fontSize: 13 }}>{g.email}</span> : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
