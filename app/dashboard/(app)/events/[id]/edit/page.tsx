import Link from "next/link";

import { EventDetail, card, getJSON } from "../_shared";
import { EditForm } from "./EditForm";

export const dynamic = "force-dynamic";

interface EditEvent extends EventDetail {
  endTime?: string | null;
}

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getJSON<EditEvent>(`/events/${id}`);

  return (
    <div style={{ maxWidth: 620, margin: "0 auto" }}>
      <Link href={`/dashboard/events/${id}`} style={{ color: "#161616", fontWeight: 700, fontSize: 14 }}>
        ← {event?.name ?? "Event"}
      </Link>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: "12px 0 18px", color: "#111" }}>Edit event</h1>

      {!event ? (
        <div style={{ ...card, color: "#888", textAlign: "center" }}>Couldn&apos;t load this event.</div>
      ) : (
        <EditForm
          event={{
            id: event.id,
            name: event.name,
            venueName: event.venueName,
            venueAddress: event.venueAddress,
            description: event.description,
            capacity: event.capacity,
            eventDate: event.eventDate,
            endTime: event.endTime ?? null,
          }}
        />
      )}
    </div>
  );
}
