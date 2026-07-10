import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter, SiteHeader } from "@/components/site-chrome";
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

  // Sales close when the event ends — endTime, or a 6h fallback for legacy
  // events with none. Mirrors the backend cutoff in validateAndPrice.
  const endMs = event.endTime
    ? new Date(event.endTime).getTime()
    : new Date(event.eventDate).getTime() + 6 * 60 * 60 * 1000;
  const ended = Date.now() > endMs;

  const organizer = event.organizer;

  return (
    <>
      <SiteHeader />
      <main className="event">
        <AppBanner eventId={event.id} />

        {event.flyerUrl && (
          <div className="flyer-stage">
            <div
              className="flyer-bg"
              style={{ backgroundImage: `url("${event.flyerUrl}")` }}
              aria-hidden
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="flyer" src={event.flyerUrl} alt={event.name} />
          </div>
        )}

        <div className="content">
          <h1 className="title">{event.name}</h1>
          {organizer && (
            <Link href={`/p/${organizer.id}`} className="promoter-byline">
              {organizer.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="promoter-byline-logo" src={organizer.logoUrl} alt="" />
              ) : (
                <span className="promoter-byline-logo promoter-byline-fallback">
                  {organizer.name?.[0]?.toUpperCase()}
                </span>
              )}
              <span className="promoter-byline-name">{organizer.name}</span>
            </Link>
          )}
          <p className="meta">
            {formatDate(event.eventDate)} · {formatTime(event.eventDate)}
          </p>
        <p className="venue">
          {event.venueName}
          <br />
          <span className="addr">{event.venueAddress}</span>
        </p>

        {ended ? (
          <p className="ended">This event has ended — ticket sales are closed.</p>
        ) : (
          <BuyBox
          capacity={event.capacity} eventId={event.id} tickets={tickets} fee={fee} isFree={event.isFree} />
        )}

        {event.description && (
          <div className="desc-card">
            <p className="desc-label">About this event</p>
            <p className="desc">{event.description}</p>
          </div>
        )}

          {organizer && (
            <Link href={`/p/${organizer.id}`} className="more-from">
              More from {organizer.name} →
            </Link>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
