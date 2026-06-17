// Shapes returned by the fansonly APIs (subset the web needs).

export interface BuyTicketType {
  id: string;
  name: string;
  category: "admission" | "drink" | "merch" | "credits" | "other";
  price: string;
  isPayWhatYouWant: boolean;
  minPrice: string | null;
  maxPrice: string | null;
  quantity: number;
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
  doorsTime: string;
  capacity: number;
  status: "draft" | "published" | "cancelled";
  flyerUrl: string | null;
  ticketTypes: BuyTicketType[];
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
