import { NextRequest, NextResponse } from "next/server";
import { previewOrder } from "@/lib/backend";

// POST /api/events/:id/preview — proxies to the orders/preview endpoint so the
// browser stays same-origin. Prices a cart + optional discount code; the server
// re-validates + re-prices authoritatively at checkout.
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
  const res = await previewOrder(id, body);
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
