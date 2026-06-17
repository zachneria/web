import { NextRequest, NextResponse } from "next/server";
import { createIntent } from "@/lib/backend";

// POST /api/events/:id/intent — proxies to the orders/intent endpoint so the
// browser stays same-origin. The server re-validates + re-prices.
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
  const res = await createIntent(id, body);
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
