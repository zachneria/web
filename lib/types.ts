// Shapes returned by the shabanga APIs (subset the web needs).

export interface PriceOption {
  label: string | null;
  price: number;
}

export interface BuyTicketType {
  id: string;
  name: string;
  category: "admission" | "drink" | "merch" | "credits" | "other";
  price: string;
  isPayWhatYouWant: boolean;
  minPrice: string | null;
  maxPrice: string | null;
  priceOptions?: PriceOption[] | null; // choose-a-price: pick one, 1 per person
  quantity: number;
  sold?: number; // admission tickets already sold; remaining = quantity − sold
  absorbFee: boolean;
  salesStart: string | null;
  salesEnd: string | null;
}

// Registered artist linked to the event via a production cost (Cost.talentId).
// `handle` is /a/-ready (artist handle → promoter handle → uuid fallback).
export interface LineupArtist {
  stageName: string;
  handle: string;
  photoUrl: string | null;
  genres: string | null;
  mixUrl: string | null;
}

export interface BuyEvent {
  id: string;
  slug?: string | null; // friendly URL slug, frozen at first publish
  name: string;
  description: string | null;
  venueName: string | null; // null when locationHidden (#44) — backend strips it
  venueAddress: string | null;
  venueLat?: number | null;
  venueLng?: number | null;
  timezone?: string | null;
  eventDate: string;
  endTime?: string | null;
  doorsTime: string;
  capacity: number;
  isFree?: boolean; // free/RSVP event — no fee, reserve up to 2
  locationHidden?: boolean;
  locationTeaser?: string | null;
  status: "draft" | "published" | "cancelled";
  flyerUrl: string | null;
  updatedAt?: string; // for sitemap lastmod
  ticketTypes: BuyTicketType[];
  organizer?: Promoter | null;
  lineup?: LineupArtist[];
}

export interface Promoter {
  id: string;
  name: string;
  handle?: string | null; // friendly /p/<handle> URL
  logoUrl: string | null;
  bio?: string | null;
  links?: { instagram?: string; facebook?: string; tiktok?: string } | null;
}

export interface PromoterEventCard {
  id: string;
  name: string;
  venueName: string;
  eventDate: string;
  endTime?: string | null;
  flyerUrl: string | null;
  currentTier?: string | null;
  soldPct?: number;
  soldOut?: boolean;
}

export interface PromoterPage {
  organizer: Promoter;
  events: PromoterEventCard[];
}

export interface BuyTicket {
  id: string;
  qrToken: string;
  ownerName: string;
  ticketTypeName: string;
  status: string;
}

export interface OrderView {
  event: {
    id: string;
    name: string;
    eventDate: string;
    venueName: string;
    venueAddress: string;
  };
  tickets: BuyTicket[];
}

export interface IntentResult {
  clientSecret: string;
  orderId: string;
  amount: number;
  viewToken: string;
}
