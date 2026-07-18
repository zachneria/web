import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { getEvent, getBuyerFee } from "@/lib/backend";
import { admissionTypes, formatDate, formatTime } from "@/lib/pricing";
import { eventJsonLd, eventUrl, SEO_LIVE } from "@/lib/seo";
import type { LineupArtist } from "@/lib/types";
import AppBanner from "./AppBanner";
import BuyBox from "./BuyBox";

// Featured-mix embed — same providers as the /a/ artist page (SoundCloud /
// YouTube / Mixcloud inline; anything else falls back to a link).
function MixEmbed({ url }: { url: string }) {
  if (/soundcloud\.com/.test(url)) {
    const src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23af52de&auto_play=false&hide_related=true&show_comments=false&show_user=true&visual=true`;
    return <iframe className="lineup-embed" height="300" src={src} allow="autoplay" title="Latest mix" />;
  }
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (yt) {
    return (
      <iframe
        className="lineup-embed lineup-embed-video"
        src={`https://www.youtube.com/embed/${yt[1]}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Latest mix"
      />
    );
  }
  if (/mixcloud\.com/.test(url)) {
    const src = `https://www.mixcloud.com/widget/iframe/?hide_cover=1&feed=${encodeURIComponent(url)}`;
    return <iframe className="lineup-embed" height="120" src={src} title="Latest mix" />;
  }
  return (
    <a className="lineup-mix-link" href={url} target="_blank" rel="noopener noreferrer">
      Hear the latest mix ↗
    </a>
  );
}

function Lineup({ artists }: { artists: LineupArtist[] }) {
  return (
    <div className="lineup-card">
      <p className="desc-label">Lineup</p>
      {artists.map((a) => (
        <div key={a.handle} className="lineup-artist">
          <Link href={`/a/${a.handle}`} className="lineup-row">
            {a.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="lineup-avatar" src={a.photoUrl} alt="" />
            ) : (
              <span className="lineup-avatar lineup-avatar-fallback">
                {a.stageName?.[0]?.toUpperCase()}
              </span>
            )}
            <span className="lineup-who">
              <span className="lineup-name">{a.stageName}</span>
              {a.genres && <span className="lineup-genres">{a.genres}</span>}
            </span>
            <span className="lineup-arrow">→</span>
          </Link>
          {a.mixUrl && <MixEmbed url={a.mixUrl} />}
        </div>
      ))}
    </div>
  );
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) return { title: "Event — shabanga" };
  // Hidden-location safe: fall back to the teaser, never print "null".
  const place = event.venueName || event.locationTeaser;
  const desc = place
    ? `${formatDate(event.eventDate)} · ${place}`
    : formatDate(event.eventDate);
  const canonical = eventUrl(event);
  return {
    title: `${event.name} — shabanga`,
    description: desc,
    // Pre-launch: keep every event page out of the index (test data).
    ...(SEO_LIVE ? {} : { robots: { index: false, follow: false } }),
    alternates: { canonical },
    openGraph: {
      title: event.name,
      description: desc,
      url: canonical,
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
  const lineup = event.lineup ?? [];

  return (
    <>
      {/* schema.org/Event structured data for Google rich results. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd(event)) }}
      />
      <SiteHeader />
      <main className="event">
        <AppBanner eventId={event.id} />

        {/* Wide, find-page-width shell: flyer column beside the details column
            on desktop; stacks back to the classic flyer-first layout on mobile. */}
        <div className="event-inner">
          <div className={event.flyerUrl ? "event-grid" : "event-grid event-grid-noflyer"}>
            {event.flyerUrl && (
              <div className="event-flyer-col">
                <div className="flyer-stage flyer-card">
                  <div
                    className="flyer-bg"
                    style={{ backgroundImage: `url("${event.flyerUrl}")` }}
                    aria-hidden
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="flyer" src={event.flyerUrl} alt={event.name} />
                </div>
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
                {event.venueName ||
                  event.locationTeaser ||
                  "Location revealed before doors"}
                {event.venueAddress && (
                  <>
                    <br />
                    <span className="addr">{event.venueAddress}</span>
                  </>
                )}
              </p>

              {ended ? (
                <p className="ended">This event has ended — ticket sales are closed.</p>
              ) : (
                <BuyBox
                  capacity={event.capacity}
                  eventId={event.id}
                  tickets={tickets}
                  fee={fee}
                  isFree={event.isFree}
                />
              )}

              {lineup.length > 0 && <Lineup artists={lineup} />}

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
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
