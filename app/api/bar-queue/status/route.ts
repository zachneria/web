import { NextRequest, NextResponse } from "next/server";
import { barQueueStatus } from "@/lib/backend";

// POST /api/bar-queue/status { eventId, pin, orderId, barStatus } — advance an
// order through the Board-mode lanes (new|preparing|ready). PIN + web key stay
// server-side. (#51)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { eventId, pin, orderId, barStatus } = body || {};
  if (!eventId || !pin || !orderId || !barStatus) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const res = await barQueueStatus({ eventId, eventPin: pin, orderId, barStatus });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
