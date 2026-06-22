import { NextRequest, NextResponse } from "next/server";
import { createFreeOrder } from "@/lib/backend";

// POST /api/events/:id/order — proxies to the free ($0) order endpoint so a
// browser RSVP / fully-discounted order completes without Stripe. Returns the
// issued tickets. The server re-validates + re-prices.
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const res = await createFreeOrder(id, body);
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
