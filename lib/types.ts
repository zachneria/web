// Shapes returned by the fansonly APIs (subset the web needs).

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

export interface BuyEvent {
  id: string;
  name: string;
  description: string | null;
  venueName: string;
  venueAddress: string;
  eventDate: string;
  endTime?: string | null;
  doorsTime: string;
  capacity: number;
  isFree?: boolean; // free/RSVP event — no fee, reserve up to 2
  status: "draft" | "published" | "cancelled";
  flyerUrl: string | null;
  ticketTypes: BuyTicketType[];
  organizer?: Promoter | null;
}

export interface Promoter {
  id: string;
  name: string;
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
