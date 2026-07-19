import { NextRequest, NextResponse } from "next/server";
import { barQueueComplete } from "@/lib/backend";

// POST /api/bar-queue/complete { eventId, pin, orderId } — redeem an order's
// extras (voids the code). PIN + web key stay server-side.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { eventId, pin, orderId } = body || {};
  if (!eventId || !pin || !orderId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const res = await barQueueComplete({ eventId, eventPin: pin, orderId });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
