// SEO helpers — canonical URLs + JSON-LD structured data for event pages, so
// shabanga event pages can surface in Google with rich results (like
// Eventbrite). Everything here runs server-side (Server Components / metadata).
import { admissionTypes, fromPrice } from "./pricing";
import type { BuyEvent } from "./types";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://shabanga.com"
).replace(/\/$/, "");

// Master switch for search indexing of EVENT/promoter/artist pages. OFF until
// launch so test events never reach Google — flip SEO_LIVE=true in Vercel once
// test data is cleaned and real events exist. The marketing homepage indexes
// regardless. When off: robots disallows /e /p /a, the sitemap lists only the
// homepage, and event pages emit noindex.
export const SEO_LIVE = process.env.SEO_LIVE === "true";

// Canonical path for an event — friendly slug preferred, uuid fallback. The
// slug is frozen at first publish, so it's the stable, shareable, indexable URL.
export function eventPath(event: Pick<BuyEvent, "id" | "slug">): string {
  return `/e/${event.slug || event.id}`;
}

export function eventUrl(event: Pick<BuyEvent, "id" | "slug">): string {
  return `${SITE_URL}${eventPath(event)}`;
}

// schema.org/Event JSON-LD. Honors #44 hidden-location: the backend nulls
// venueName/Address when hidden, so we simply omit the location node — the
// address is never in the payload to leak.
export function eventJsonLd(event: BuyEvent): Record<string, unknown> {
  const url = eventUrl(event);
  const admission = admissionTypes(event);

  const endMs = event.endTime
    ? new Date(event.endTime).getTime()
    : new Date(event.eventDate).getTime() + 6 * 60 * 60 * 1000;
  const ended = Date.now() > endMs;
  const soldOut =
    admission.length > 0 &&
    admission.every((t) => t.quantity > 0 && (t.sold ?? 0) >= t.quantity);
  const low = event.isFree ? 0 : fromPrice(admission) ?? 0;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.name,
    startDate: event.eventDate,
    ...(event.endTime ? { endDate: event.endTime } : {}),
    eventStatus:
      event.status === "cancelled"
        ? "https://schema.org/EventCancelled"
        : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url,
    ...(event.flyerUrl ? { image: [event.flyerUrl] } : {}),
    ...(event.description ? { description: event.description } : {}),
  };

  // Location — omitted entirely when hidden (venueName/Address come back null).
  if (event.venueName || event.venueAddress) {
    const place: Record<string, unknown> = { "@type": "Place" };
    if (event.venueName) place.name = event.venueName;
    if (event.venueAddress) {
      place.address = { "@type": "PostalAddress", name: event.venueAddress };
    }
    if (typeof event.venueLat === "number" && typeof event.venueLng === "number") {
      place.geo = {
        "@type": "GeoCoordinates",
        latitude: event.venueLat,
        longitude: event.venueLng,
      };
    }
    jsonLd.location = place;
  }

  if (event.organizer) {
    jsonLd.organizer = {
      "@type": "Organization",
      name: event.organizer.name,
      url: `${SITE_URL}/p/${event.organizer.handle || event.organizer.id}`,
    };
  }

  // Performers = the registered lineup (each links to its /a/ artist page).
  if (event.lineup && event.lineup.length > 0) {
    jsonLd.performer = event.lineup.map((a) => ({
      "@type": "PerformingGroup",
      name: a.stageName,
      url: `${SITE_URL}/a/${a.handle}`,
    }));
  }

  jsonLd.offers = {
    "@type": "AggregateOffer",
    priceCurrency: "USD",
    lowPrice: low,
    offerCount: admission.length || 1,
    availability:
      soldOut || ended
        ? "https://schema.org/SoldOut"
        : "https://schema.org/InStock",
    url,
  };

  return jsonLd;
}
