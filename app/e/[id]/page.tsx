import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getEvent, getBuyerFee } from "@/lib/backend";
import { admissionTypes, formatDate, formatTime } from "@/lib/pricing";
import AppBanner from "./AppBanner";
import BuyBox from "./BuyBox";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) return { title: "Event — fansonly" };
  const desc = `${formatDate(event.eventDate)} · ${event.venueName}`;
  return {
    title: `${event.name} — fansonly`,
    description: desc,
    openGraph: {
      title: event.name,
      description: desc,
      images: event.flyerUrl ? [{ url: event.flyerUrl }] : [],
      type: "website",
    },
    twitter: {
      card: event.flyerUrl ? "summary_large_image" : "summary",
      title: event.name,
      description: desc,
      images: event.flyerUrl ? [event.flyerUrl] : [],
    },
  };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event || event.status !== "published") notFound();

  const [fee, tickets] = [await getBuyerFee(), admissionTypes(event)];

  return (
    <main className="event">
      <AppBanner eventId={event.id} />

      {event.flyerUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="flyer" src={event.flyerUrl} alt={event.name} />
      )}

      <div className="content">
        <h1 className="title">{event.name}</h1>
        <p className="meta">
          {formatDate(event.eventDate)} · {formatTime(event.eventDate)}
        </p>
        <p className="venue">
          {event.venueName}
          <br />
          <span className="addr">{event.venueAddress}</span>
        </p>

        <BuyBox eventId={event.id} tickets={tickets} fee={fee} />

        {event.description && <p className="desc">{event.description}</p>}
      </div>
    </main>
  );
}
