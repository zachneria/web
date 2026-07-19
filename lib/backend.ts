// Server-side calls to the shabanga API. Kept on the server (Server Components +
// route handlers) so the browser never hits api.shabanga.com directly — no CORS
// to configure, and the API base stays out of the client bundle.
import type { BuyEvent, PromoterPage } from "./types";

const API_BASE = process.env.API_BASE_URL || "https://api.shabanga.com";

// Server-side API key (Vercel env SHABANGA_API_KEY) — attached to every
// upstream call, never shipped to the browser (all fetches here run in
// server components / route handlers). The client-platform pattern.
const API_KEY = process.env.SHABANGA_API_KEY;
const apiFetch = (url: string, init: RequestInit & { next?: { revalidate?: number } } = {}) =>
  fetch(url, {
    ...init,
    headers: {
      ...(init.headers || {}),
      ...(API_KEY ? { "x-api-key": API_KEY } : {}),
    },
  });
const BUYER_FEE_FALLBACK = 0.99;

// Public browse/search — published + discoverable events (the /events page).
export interface FindEvent {
  id: string;
  slug?: string | null; // present once fo-events /search returns it (sitemap)
  updatedAt?: string; // sitemap lastmod
  name: string;
  venueName: string;
  eventDate: string;
  endTime?: string | null;
  flyerUrl: string | null;
  organizerName?: string | null;
  organizerLogoUrl?: string | null;
  organizerId?: string | null;
  organizerHandle?: string | null;
  fromPrice?: number | null;
  createdAt?: string;
  soldPct?: number;
  soldOut?: boolean;
}
export async function browseEvents(q = ""): Promise<FindEvent[]> {
  try {
    const res = await apiFetch(
      `${API_BASE}/events/search${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`,
      { next: { revalidate: 30 } },
    );
    if (!res.ok) return [];
    return (await res.json()) as FindEvent[];
  } catch {
    return [];
  }
}

// A promoter's name + logo and their published upcoming events.
export async function getPromoter(id: string): Promise<PromoterPage | null> {
  try {
    const res = await apiFetch(`${API_BASE}/events/promoter/${id}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    return (await res.json()) as PromoterPage;
  } catch {
    return null;
  }
}

// A talent/artist's public profile + gigs (drives the /a/ page).
export interface ArtistGig {
  id: string;
  slug: string | null;
  name: string;
  venueName: string;
  eventDate: string;
  flyerUrl: string | null;
  organizerName: string;
  organizerHandle: string | null;
}
export interface ArtistPage {
  talent: {
    id: string;
    name: string;
    handle: string | null;
    bio: string | null;
    genres: string | null;
    city: string | null;
    photoUrl: string | null;
    mixUrl: string | null;
    suggestedRate: number | null; // present only when the artist's showRate toggle is on
    links: Partial<Record<"instagram" | "facebook" | "tiktok" | "youtube" | "spotify", string>> | null;
    bookingEmail: string | null;
  };
  events: ArtistGig[];
  pastGigs: ArtistGig[];
  stats: { shows: number; promoters: number };
}
export async function getArtist(id: string): Promise<ArtistPage | null> {
  try {
    const res = await apiFetch(`${API_BASE}/events/talent/${id}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    return (await res.json()) as ArtistPage;
  } catch {
    return null;
  }
}

export async function getEvent(id: string): Promise<BuyEvent | null> {
  try {
    const res = await apiFetch(`${API_BASE}/events/${id}`, {
      next: { revalidate: 30 }, // brief cache; edits show within ~30s
    });
    if (!res.ok) return null;
    return (await res.json()) as BuyEvent;
  } catch {
    return null;
  }
}

// Live buyer fee (admin-editable). Falls back to 0.99 if unavailable.
export async function getBuyerFee(): Promise<number> {
  try {
    const res = await apiFetch(`${API_BASE}/tickets/config`, { next: { revalidate: 60 } });
    if (!res.ok) return BUYER_FEE_FALLBACK;
    const data = await res.json();
    return typeof data?.buyerFee === "number" ? data.buyerFee : BUYER_FEE_FALLBACK;
  } catch {
    return BUYER_FEE_FALLBACK;
  }
}

// Bar queue (#51) — PIN-gated staff display. Proxied server-side so the web
// key + PIN never sit in the browser. Return the raw Response for passthrough.
export function barQueue(eventId: string, pin: string): Promise<Response> {
  return apiFetch(
    `${API_BASE}/checkin/event/${eventId}/bar-queue?eventPin=${encodeURIComponent(pin)}`,
    { cache: "no-store" },
  );
}
export function barQueueComplete(body: unknown): Promise<Response> {
  return apiFetch(`${API_BASE}/checkin/bar-queue/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Proxied by the route handlers — return the raw Response so status passes through.
export function createIntent(eventId: string, body: unknown): Promise<Response> {
  return apiFetch(`${API_BASE}/tickets/events/${eventId}/orders/intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Price a cart + optional discount code before charging.
export function previewOrder(eventId: string, body: unknown): Promise<Response> {
  return apiFetch(`${API_BASE}/tickets/events/${eventId}/orders/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Free / $0 order (RSVP, or a code that zeroes the total) — no Stripe; issues
// tickets immediately.
export function createFreeOrder(eventId: string, body: unknown): Promise<Response> {
  return apiFetch(`${API_BASE}/tickets/events/${eventId}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function getOrder(token?: string, code?: string): Promise<Response> {
  const query = code
    ? `code=${encodeURIComponent(code)}`
    : `token=${encodeURIComponent(token ?? "")}`;
  return apiFetch(`${API_BASE}/tickets/order?${query}`);
}
