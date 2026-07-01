import { orgFetch } from "@/lib/org-api";

// Shared helpers/types/styles for the event hub + its sub-pages (Tickets,
// Guests, Production, Payouts, …). Server-only (uses orgFetch).

export interface EventDetail {
  id: string;
  name: string;
  venueName: string;
  venueAddress: string;
  eventDate: string;
  status: "draft" | "published" | "cancelled";
  capacity: number;
  description?: string;
  slug?: string | null;
}
export interface DetailSummary {
  ticketsSold?: number;
  grossRevenue?: number;
  checkedIn?: number;
  ticketTypes?: { name: string; sold: number; total: number }[];
}
export interface TicketType {
  id: string;
  name: string;
  category: string;
  price: string;
  quantity: number;
}
export interface Guest {
  id: string;
  name: string;
  email?: string;
}
export interface Cost {
  category?: string;
  description?: string;
  amount?: string | number;
  payeeName?: string | null;
}
export interface Payout {
  grossRevenue?: number;
  totalCosts?: number;
  netPayout?: number;
  youKeep?: number;
  depositAmount?: number;
  tipsCollected?: number;
  costs?: Cost[];
}

export const STATUS: Record<EventDetail["status"], { label: string; fg: string; bg: string }> = {
  published: { label: "Published", fg: "#1B873F", bg: "#E4F6E9" },
  draft: { label: "Draft", fg: "#6B6B6B", bg: "#EEE" },
  cancelled: { label: "Cancelled", fg: "#C0322B", bg: "#FBE6E5" },
};

export const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
export const fmtTime = (s: string) =>
  new Date(s).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
export const money = (n: unknown) => `$${Number(n ?? 0).toFixed(2)}`;

export async function getJSON<T>(path: string): Promise<T | null> {
  try {
    const r = await orgFetch(path);
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null;
  }
}

export const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #eee",
  borderRadius: 14,
  padding: 18,
  marginBottom: 14,
};
export const sectionLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "#999",
  textTransform: "uppercase",
  letterSpacing: 0.5,
  marginBottom: 10,
};
export const row: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 8,
  padding: "6px 0",
};
export const rowVal: React.CSSProperties = {
  fontWeight: 600,
  color: "#222",
  fontVariantNumeric: "tabular-nums",
};

// Small header shown atop every sub-page: back-to-hub link + event name + status.
export function eventHeaderData(e: EventDetail) {
  return { pill: STATUS[e.status] || STATUS.draft };
}
