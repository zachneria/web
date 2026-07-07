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
    <div style={{ maxWidth: 620, margin: "0 auto" }}>
      <Link href={`/dashboard/events/${id}`} style={{ color: "#F5E642", fontWeight: 700, fontSize: 14 }}>
        ← {event?.name ?? "Event"}
      </Link>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: "12px 0 18px", color: "#F2F2F2" }}>
        Guests {guests && guests.length > 0 ? `(${guests.length})` : ""}
      </h1>

      <GuestAddForm eventId={id} />

      <div style={card}>
        {!guests || guests.length === 0 ? (
          <div style={{ color: "#8F8F8F" }}>No guest passes yet — add one above.</div>
        ) : (
          guests.map((g) => (
            <div key={g.id} style={row}>
              <span style={{ color: "#D8D8D8" }}>{g.name}</span>
              {g.email ? <span style={{ color: "#8F8F8F", fontSize: 13 }}>{g.email}</span> : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
