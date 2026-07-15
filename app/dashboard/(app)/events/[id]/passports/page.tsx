import Link from "next/link";

import { getJSON } from "../_shared";
import { PassportsClient } from "./PassportsClient";

export const dynamic = "force-dynamic";

interface TierEvent {
  name: string;
  eventDate: string;
  doorsTime?: string;
  drinkTierEnabled?: boolean;
  drinkTierThreshold?: string | number | null;
}

export default async function PassportsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getJSON<TierEvent>(`/events/${id}`);

  // Rules freeze once the event starts.
  const startMs = event ? new Date(event.doorsTime ?? event.eventDate).getTime() : 0;
  const locked = !!event && Date.now() >= startMs;
  const enabled = event?.drinkTierEnabled !== false;
  const threshold =
    event?.drinkTierThreshold != null ? String(Math.round(parseFloat(String(event.drinkTierThreshold)))) : "10";

  return (
    <div style={{ maxWidth: 640 }}>
      <Link href={`/dashboard/events/${id}`} style={{ color: "#0B8896", fontWeight: 700, fontSize: 14 }}>
        {event?.name ?? "Event"}
      </Link>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: "12px 0 18px", color: "#161616" }}>Passports</h1>
      <PassportsClient
        eventId={id}
        locked={locked}
        initialEnabled={enabled}
        initialThreshold={threshold}
      />
    </div>
  );
}
