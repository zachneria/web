// Pure helpers — safe in both Server Components and the client.
import type { BuyEvent, BuyTicketType } from "./types";

export const BRAND = "#B7F34D";

// WEB IS ADMISSION-ONLY. Drinks/credits/merch are app-only for now, so the site
// never lists or sells them.
export function admissionTypes(event: BuyEvent): BuyTicketType[] {
  const isChoose = (t: BuyTicketType) =>
    Array.isArray(t.priceOptions) && t.priceOptions.length > 0;
  // Choose-a-price ("Choose Your Adventure") always sits above the fixed tiers.
  return (event.ticketTypes || [])
    .filter((t) => t.category === "admission")
    .sort((a, b) => Number(isChoose(b)) - Number(isChoose(a)));
}

export const money = (n: number) => `$${n.toFixed(2)}`;

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export interface CartTotals {
  lines: {
    ticketTypeId: string;
    name: string;
    quantity: number;
    unit: number;
    priced?: boolean; // choose-a-price → send the chosen price to the server
  }[];
  subtotal: number;
  fee: number;
  total: number;
  count: number;
}

// cart: { [ticketTypeId]: quantity }. `chosen`: { [id]: price } for choose-a-
// price types. One flat buyer fee, waived only if every selected line absorbs
// it. Server re-prices authoritatively; this is for display.
export function computeTotals(
  types: BuyTicketType[],
  cart: Record<string, number>,
  fee: number,
  chosen: Record<string, number> = {},
): CartTotals {
  const lines: CartTotals["lines"] = [];
  let subtotal = 0;
  let count = 0;
  let feeUnits = 0; // fee-bearing admission tickets (matches the server: fee × units)
  for (const t of types) {
    const quantity = cart[t.id] || 0;
    if (quantity <= 0) continue;
    const opts = Array.isArray(t.priceOptions) ? t.priceOptions : null;
    let unit: number;
    let qty = quantity;
    let priced = false;
    if (opts && opts.length) {
      qty = 1; // choose-a-price is capped at 1
      unit = chosen[t.id] ?? opts[0].price;
      priced = true;
    } else {
      unit = parseFloat(t.price);
    }
    subtotal += unit * qty;
    count += qty;
    if (!t.absorbFee) feeUnits += qty;
    lines.push({ ticketTypeId: t.id, name: t.name, quantity: qty, unit, priced });
  }
  // Web is admission-only: the buyer fee is PER TICKET (fee × fee-bearing units),
  // matching fo-tickets validateAndPrice + the app. (Was a flat fee — undercounted.)
  const appliedFee = Math.round(fee * feeUnits * 100) / 100;
  return { lines, subtotal, fee: appliedFee, total: subtotal + appliedFee, count };
}

export const fromPrice = (types: BuyTicketType[]): number | null => {
  const prices = types.map((t) => parseFloat(t.price));
  return prices.length ? Math.min(...prices) : null;
};
