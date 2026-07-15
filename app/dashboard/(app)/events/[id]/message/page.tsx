import Link from "next/link";

import { EventDetail, getJSON } from "../_shared";
import { MessageClient } from "./MessageClient";

export const dynamic = "force-dynamic";

interface AnnounceData {
  recipientCount?: number;
  announcements?: { subject: string; body: string; createdAt?: string; sentAt?: string }[];
}

export default async function MessagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [event, ann] = await Promise.all([
    getJSON<EventDetail>(`/events/${id}`),
    getJSON<AnnounceData>(`/tickets/events/${id}/announce`),
  ]);

  return (
    <div style={{ maxWidth: 640 }}>
      <Link href={`/dashboard/events/${id}`} style={{ color: "#0B8896", fontWeight: 700, fontSize: 14 }}>
        ← {event?.name ?? "Event"}
      </Link>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: "12px 0 4px", color: "#161616" }}>Message buyers</h1>
      <p style={{ color: "#8A8A8A", fontSize: 14, margin: "0 0 18px" }}>
        Emails everyone with a ticket to this event.
      </p>
      <MessageClient
        eventId={id}
        eventName={event?.name ?? "the event"}
        recipientCount={ann?.recipientCount ?? 0}
        history={ann?.announcements ?? []}
      />
    </div>
  );
}
