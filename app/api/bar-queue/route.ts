import { NextRequest, NextResponse } from "next/server";
import { barQueue } from "@/lib/backend";

// GET /api/bar-queue?e=<eventId>&pin=<doorPin> — proxies the PIN-gated bar
// queue so the web key + PIN stay server-side. The staff page polls this.
export async function GET(req: NextRequest) {
  const e = req.nextUrl.searchParams.get("e");
  const pin = req.nextUrl.searchParams.get("pin");
  if (!e || !pin) {
    return NextResponse.json({ error: "Missing e or pin" }, { status: 400 });
  }
  const res = await barQueue(e, pin);
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
