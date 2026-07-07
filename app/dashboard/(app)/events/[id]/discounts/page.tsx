import Link from "next/link";

import { EventDetail, getJSON } from "../_shared";
import { DiscountsClient } from "./DiscountsClient";

export const dynamic = "force-dynamic";

export default async function DiscountsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getJSON<EventDetail>(`/events/${id}`);

  return (
    <div style={{ maxWidth: 620, margin: "0 auto" }}>
      <Link href={`/dashboard/events/${id}`} style={{ color: "#F5E642", fontWeight: 700, fontSize: 14 }}>
        ← {event?.name ?? "Event"}
      </Link>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: "12px 0 18px", color: "#F2F2F2" }}>Discounts</h1>
      <DiscountsClient eventId={id} />
    </div>
  );
}
